import { Process, Processor } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { SUREVY_QUEUE, SURVEY_AFTER_SUBMITION_PROCESS } from "../constants";
import {
  SurveyDescriptionStatus,
  SurveyRespondantStatus,
  SurveyStatus,
} from "../type";
import { InjectModel } from "@nestjs/sequelize";
import {
  Survey,
  SurveyDescription,
  SurveyExternalRespondant,
  SurveyRespondant,
  SurveyResponse,
} from "../models";
import * as moment from "moment";
import { Rater } from "src/modules/settings/modules/rater/models";
import { User } from "src/modules/users/models";
import { Op, col, fn, literal } from "sequelize";
import { TenantHistoryTypes } from "src/modules/tenants/types";
import { SurveyService } from "./survey.service";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { Tenant, TenantHistory, TenantUser } from "src/modules/tenants/models";
import { ReportsService } from "src/modules/reports/reports.service";
import { NbolSurveyService } from "./nbolSurvey.service";
import { Job } from "bull";
import {
  Question,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { QuestionResponseOptions } from "src/modules/competencies/modules/questions/types";
import {
  Questionnaire,
  QuestionnaireQuestion,
} from "src/modules/questionnaires/models";
import { Competency } from "src/modules/competencies/models";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {
  defaultAttachments,
  defaultContext,
} from "src/common/modules/mails/constants";
import { MailsService } from "src/common/modules/mails";

@Injectable()
@Processor(SUREVY_QUEUE)
export class SurveyProcessor {
  constructor(
    @InjectModel(SurveyRespondant)
    private readonly surveyRespondant: typeof SurveyRespondant,
    @InjectModel(SurveyExternalRespondant)
    private readonly surveyExternalRespondant: typeof SurveyExternalRespondant,
    @InjectModel(Survey) private readonly survey: typeof Survey,
    @InjectModel(SurveyDescription)
    private readonly surveyDescription: typeof SurveyDescription,
    @InjectModel(TenantHistory)
    private readonly tenantHistory: typeof TenantHistory,
    @InjectModel(Question)
    private readonly question: typeof Question,
    @InjectModel(Competency)
    private readonly competency: typeof Competency,
    @InjectModel(Tenant)
    private readonly tenant: typeof Tenant,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailsService: MailsService
  ) {}

  @Process(SURVEY_AFTER_SUBMITION_PROCESS)
  async afterSurveySubmitionProcess(job: Job<any>) {
    const { body, respondants, token } = job.data;

    try {
      if (body.status === SurveyStatus.Completed) {
        if (!token.is_external) {
          await this.surveyRespondant.schema(token.schema_name).update(
            {
              status: SurveyRespondantStatus.Completed,
              response_date: moment().format(),
            },
            { where: { id: respondants } }
          );
        } else {
          await this.surveyExternalRespondant.schema(token.schema_name).update(
            {
              status: SurveyRespondantStatus.Completed,
              response_date: moment().format(),
            },
            { where: { id: respondants } }
          );
        }

        const surveys = await this.survey.schema(token.schema_name).findAll({
          where: {
            survey_id: token.survey_id,
            status: SurveyStatus.Ongoing,
          },
          include: [
            {
              model: SurveyExternalRespondant,
              required: false,
              where: {
                status: SurveyRespondantStatus.Completed,
              },
            },
            {
              model: SurveyRespondant,
              required: false,
              where: {
                status: SurveyRespondantStatus.Completed,
              },
            },
          ],
        });
        // let completedCount = 0;
        let surevyUpdates = [];
        for (const survey of surveys) {
          if (
            survey.no_of_respondents ===
            survey.survey_respondants.length +
              survey.survey_external_respondants.length
          ) {
            surevyUpdates.push(
              survey.update({ status: SurveyStatus.Completed })
            );
            // completedCount++;
          }
        }

        await Promise.all(surevyUpdates);

        const surveyDescription = await this.surveyDescription
          .schema(token.schema_name)
          .findOne({
            order: [[{ model: Rater, as: "raters" }, "order", "ASC"]],
            where: {
              id: token.survey_id,
            },
            include: [
              {
                model: Rater,
                include: [
                  {
                    model: SurveyRespondant,
                    include: [
                      {
                        model: SurveyResponse,
                      },
                    ],
                  },
                  {
                    model: SurveyExternalRespondant,
                    include: [
                      {
                        model: SurveyResponse,
                      },
                    ],
                  },
                ],
              },
              {
                model: Survey,
                include: [
                  {
                    model: User,
                  },
                  {
                    model: SurveyRespondant,
                    include: [
                      {
                        model: Rater,
                      },
                      {
                        model: User,
                      },
                    ],
                  },
                  {
                    model: SurveyExternalRespondant,
                    include: [
                      {
                        model: Rater,
                      },
                    ],
                  },
                ],
              },
            ],
          });

        let completed_survey = surveyDescription.surveys.reduce(
          (prev: number, curr: Survey) =>
            curr.status === SurveyStatus.Completed ? prev + 1 : prev,
          0
        );

        let surveyDescriptionBody = {
          assessments_completed: completed_survey,
          assessments_due: literal(`total_assessments - ${completed_survey}`),
        };

        if (completed_survey === surveyDescription.total_assessments) {
          surveyDescriptionBody["status"] = SurveyDescriptionStatus.Completed;
          await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).update(
            { type: TenantHistoryTypes.completed_survey },
            {
              where: { reference_id: surveyDescription.id },
            }
          );
          await surveyDescription.update(surveyDescriptionBody);
          await this.setBenchmark(surveyDescription.questionnaire_id, token);
          await this.setQuestionAvgGap(
            surveyDescription.questionnaire_id,
            token
          );
          await this.genrateReport(surveyDescription, token);
          return "Reports created successfully";
        }
        await surveyDescription.update(surveyDescriptionBody);
      }
    } catch (error) {
      console.log("error in after survey process", error);
    }
  }

  async setBenchmark(questionnaire_id: string, token?: any) {
    if (token) {
      // await this.sequelize.query(`set search_path to ${token.schema_name};`);
    }
    const questions = await this.question.schema(token.schema_name).findAll({
      where: {
        max_score: 5,
        is_copy: true,
        response_type: QuestionResponseOptions.likert_scale,
      },
      attributes: ["competency_id"],
      include: [
        {
          model: Questionnaire,
          where: { id: questionnaire_id, is_copy: true },
          attributes: [],
        },
        {
          model: SurveyResponse,
          as: "surveyResponses",
          attributes: ["id", "gap"],
          include: [
            {
              model: Rater,
              where: { name: { [Op.ne]: "Self" } },
              attributes: [],
            },
            {
              model: QuestionResponse,
              as: "response",
              attributes: ["score"],
              where: { is_copy: true },
            },
          ],
        },
      ],
    });

    let benchmark = {};

    for (const question of questions) {
      for (const resp of question.surveyResponses) {
        benchmark[question.competency_id] = benchmark[question.competency_id]
          ? {
              count: benchmark[question.competency_id].count + 1,
              score: benchmark[question.competency_id].score + resp.gap,
            }
          : { score: resp.gap, count: 1 };
      }
    }

    let competencyUpdate = [];

    for (const [key, value] of Object.entries({ ...benchmark }) as any) {
      competencyUpdate.push(
        this.competency
          .schema(token.schema_name)
          .update(
            { benchmark: +(value.score / value.count).toFixed(2) },
            { where: { id: key, is_copy: true } }
          )
      );
    }

    await Promise.all(competencyUpdate);

    return "Done";
  }

  async setQuestionAvgGap(questionnaire_id: string, token: any) {
    // await this.sequelize.query(`set search_path to ${token.schema_name};`);
    const data = JSON.parse(
      JSON.stringify(
        await this.question.schema(token.schema_name).findAll({
          where: {
            is_copy: true,
            response_type: QuestionResponseOptions.likert_scale,
          },
          group: ['"Question"."id"'],
          attributes: {
            include: [[fn("avg", col('"surveyResponses"."gap"')), "avg_gap"]],
          },
          include: [
            {
              model: SurveyResponse,
              as: "surveyResponses",
              attributes: [],
              include: [
                {
                  attributes: [],
                  model: Rater,
                  required: true,
                  where: { name: { [Op.ne]: "Self" } },
                },
              ],
            },
            {
              model: QuestionnaireQuestion,
              attributes: [],

              where: {
                questionnaire_id,
                is_copy: true,
              },
            },
          ],
        })
      )
    );

    await this.question.schema(token.schema_name).bulkCreate(
      data.map((item) => ({
        ...item,
        avg_gap:
          (item.avg_gap ? +(+item.avg_gap).toFixed(2) : item.avg_gap) || 0,
      })),
      {
        updateOnDuplicate: ["avg_gap"],
      }
    );
  }

  async genrateReport(survey: SurveyDescription, token: any) {
    const tenant = await this.tenant.schema(DB_PUBLIC_SCHEMA).findOne({
      where: {
        schema_name: token.schema_name,
      },
      include: [
        {
          as: "admin",
          model: TenantUser,
          required: false,
          on: literal('"Tenant"."admin_id" = "admin"."id"'),
          attributes: ["email", "name"],
        },
      ],
    });

    // const workbook = new ExcelJS.Workbook();

    // const sheet = workbook.addWorksheet("Report", {
    //   views: [{ state: "frozen", ySplit: 1 }],
    //   pageSetup: {
    //     horizontalCentered: true,
    //     verticalCentered: true,
    //   },
    // });
    // let rowData = [];
    // let rowValue = [
    //   "Client Name",
    //   "Survey Name",
    //   "Survey Status",
    //   "Ratee Name",
    //   "Rater Name",
    //   "No. of Reminders sent",
    //   "Rater Category",
    //   "Survey Completed",
    //   "Survey Completion Date",
    // ];
    // rowData.push(rowValue);
    // for (const surveys of survey.surveys) {
    //   if (surveys.survey_respondants.length > 0) {
    //     for (const respodants of surveys.survey_respondants) {
    //       rowData.push([
    //         tenant?.name,
    //         survey?.title,
    //         survey?.status,
    //         surveys?.employee?.name,
    //         respodants?.respondant?.name,
    //         0,
    //         respodants?.rater?.category_name,
    //         survey.status === "Completed" ? "Y" : "N",
    //         survey.status === "Completed" ? survey.updatedAt : "-",
    //       ]);
    //     }
    //   }
    //   if (surveys.survey_external_respondants.length > 0) {
    //     for (const respodants of surveys.survey_external_respondants) {
    //       rowData.push([
    //         tenant.name,
    //         survey?.title,
    //         survey.status,
    //         surveys?.employee?.name,
    //         respodants?.respondant_name,
    //         0,
    //         respodants?.rater?.category_name,
    //         survey.status === "Completed" ? "Y" : "N",
    //         survey.status === "Completed" ? survey.updatedAt : "-",
    //       ]);
    //     }
    //   }
    // }

    const channel_partner = await this.tenant.schema(DB_PUBLIC_SCHEMA).findOne({
      where: {
        id: tenant.parent_tenant_id,
      },
      include: [
        {
          as: "users",
          model: TenantUser,
          required: false,
          attributes: ["email", "name"],
        },
      ],
    });
    if (tenant.admin.email) {
      let userToken = await this.jwtService.signAsync({
        id: tenant.admin_id,
      });
      let surveyToken = await this.jwtService.signAsync({
        survey_id: survey.id,
        schema_name: token.schema_name,
        token: userToken,
      });

      let Mail = {
        to: tenant.admin.email,
        subject: `Survey Completion Report | ${survey.title}`,
        context: {
          survey_link: `${this.config.get("FE_URL")}/survey/${survey.id}`,
          composite_link: `${this.config.get(
            "BE_URL"
          )}/api/v1/reports/dual-gap/composit-report/${surveyToken}`,
          username: tenant.admin.name,
          surveyName: survey.title,
          data: survey.raters,
          logo: "cid:company-logo",
          ...defaultContext,
        },
        attachments: [
          {
            filename: "nbol-email-logo",
            path: "src/public/media/images/nbol-email-logo.png",
            cid: "company-logo",
          },
          ...defaultAttachments,
        ],
      };
      this.mailsService.CompositReportMail(Mail);
    }
    let userToken = await this.jwtService.signAsync({
      id: channel_partner.users[0].id,
    });
    let surveyToken = await this.jwtService.signAsync({
      survey_id: survey.id,
      schema_name: token.schema_name,
      token: userToken,
    });

    let Mail = {
      to: channel_partner.users[0].email,
      subject: `Survey Completion Report | ${survey.title}`,
      context: {
        survey_link: `${this.config.get(
          "FE_URL"
        )}/admin/client-configration/surveys/${token.schema_name}/${survey.id}`,
        composite_link: `${this.config.get(
          "BE_URL"
        )}/api/v1/reports/dual-gap/composit-report/${surveyToken}`,
        username: tenant.admin.name,
        surveyName: survey.title,
        data: survey.raters,
        logo: "cid:company-logo",
        tenant_name: tenant.name,
        ...defaultContext,
      },
      attachments: [
        {
          filename: "nbol-email-logo",
          path: "src/public/media/images/nbol-email-logo.png",
          cid: "company-logo",
        },
        ...defaultAttachments,
      ],
    };
    this.mailsService.CompositReportMail(Mail);
  }
}
