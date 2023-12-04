import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { literal, Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { bcrypt, getRandomPassword } from "src/common/helpers";
import { RequestParamsService } from "src/common/modules";
import { MailsService } from "src/common/modules/mails";
import { Competency } from "src/modules/competencies/models";
import {
  Question,
  QuestionAreaAssessment,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { QuestionResponseOptions } from "src/modules/competencies/modules/questions/types";
import {
  Questionnaire,
  QuestionnaireCompetency,
  QuestionnaireQuestion,
} from "src/modules/questionnaires/models";
import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";

import { User } from "src/modules/users/models";
import {
  AddRespondents,
  CreateSurveyDTO,
  SurveyFilterDTO,
  UpdateSurveyDTO,
} from "../dtos";
import {
  AlternativeExternalRespondentDTO,
  AlternativeRespondentDTO,
  SendSuggestionDTO,
} from "../dtos/alternativeRespondent.dto";
import { ApproveRespondentDTO } from "../dtos/approveRespondent.dto";
import {
  SubmitSingleSurveyDTO,
  SubmitSurveyDTO,
} from "../dtos/submitSurvey.dto";
import {
  CompetencyComment,
  Survey,
  SurveyDescription,
  SurveyExternalRespondant,
  SurveyRespondant,
  SurveyResponse,
  SurveySuggestionsLogs,
} from "../models";
import {
  SuggestedByOptions,
  SurveyDescriptionStatus,
  SurveyRespondantStatus,
  SurveyStatus,
} from "../type";

import { TenantHistory } from "src/modules/tenants/models/tenantHistory.model";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import {
  TenantHistoryTypes,
  TenantHistoryGroup,
} from "src/modules/tenants/types";
import {
  defaultAttachments,
  defaultContext,
} from "src/common/modules/mails/constants";
import { Rater } from "src/modules/settings/modules/rater/models";
import { Designation } from "src/modules/settings/modules/designation/models";
import { ReportsService } from "src/modules/reports/reports.service";
import * as moment from "moment";
import { Department } from "src/modules/settings/modules/department/models";
import { Tenant, TenantMetaData } from "src/modules/tenants/models";
import { GetSurveyService } from "./getSurvey.service";
@Injectable()
export class SurveyService {
  constructor(
    @InjectModel(SurveyDescription)
    private readonly surveyDescription: typeof SurveyDescription,
    @InjectModel(Survey)
    private readonly survey: typeof Survey,
    @InjectModel(SurveyRespondant)
    private readonly surveyRespondant: typeof SurveyRespondant,
    @InjectModel(SurveyExternalRespondant)
    private readonly surveyExternalRespondant: typeof SurveyExternalRespondant,
    @InjectModel(User)
    private readonly user: typeof User,
    @InjectModel(Questionnaire)
    private readonly questionnaire: typeof Questionnaire,
    @InjectModel(QuestionnaireCompetency)
    private readonly questionnaireCompetency: typeof QuestionnaireCompetency,
    @InjectModel(QuestionnaireQuestion)
    private readonly questionnaireQuestion: typeof QuestionnaireQuestion,
    @InjectModel(Competency)
    private readonly competency: typeof Competency,
    @InjectModel(Question)
    private readonly question: typeof Question,
    @InjectModel(QuestionResponse)
    private readonly questionResponse: typeof QuestionResponse,
    @InjectModel(QuestionAreaAssessment)
    private readonly questionAreaAssessment: typeof QuestionAreaAssessment,
    @InjectModel(SurveySuggestionsLogs)
    private readonly surveySuggestionsLogs: typeof SurveySuggestionsLogs,
    @InjectModel(SurveyResponse)
    private readonly surveyResponse: typeof SurveyResponse,
    @InjectModel(CompetencyComment)
    private readonly competencyComment: typeof CompetencyComment,
    @InjectModel(Rater)
    private readonly rater: typeof Rater,
    private readonly jwtService: JwtService,
    private readonly requestParams: RequestParamsService,
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(TenantHistory)
    private readonly tenantHistory: typeof TenantHistory,
    @InjectModel(Tenant)
    private readonly tenant: typeof Tenant,
    private readonly mailsService: MailsService,
    private readonly config: ConfigService,
    private readonly reportService: ReportsService,
    private readonly getSurveyService: GetSurveyService,
    @InjectModel(TenantMetaData)
    private readonly tenantMetaData: typeof TenantMetaData
  ) {}

  async createSurvey(body: CreateSurveyDTO) {
    const transaction = await this.sequelize.transaction();
    try {
      const questionnaireFromDB = await this.questionnaire
        .schema(this.requestParams.schema_name)
        .findOne({
          where: { id: body.questionnaire_id },
          include: {
            model: Competency,
            required: false,
            include: [
              {
                model: Question,
                include: [
                  {
                    model: QuestionnaireQuestion,
                    where: { questionnaire_id: body.questionnaire_id },
                  },
                  {
                    model: AreaAssessment,
                    required: false,
                  },
                  {
                    model: QuestionResponse,
                  },
                ],
              },
            ],
          },
        });

      // now we are creating a copy/version of questionnaire so that in future we can use copy/version to create reports
      const questionnaire = await this.questionnaire
        .schema(this.requestParams.schema_name)
        .create(
          {
            title: questionnaireFromDB.title,
            description: questionnaireFromDB.description,
            no_of_questions: questionnaireFromDB.no_of_questions,
            is_copy: true,
          },
          { transaction }
        );

      let questionnaireCompetencies = [];
      let questionnaireQuestions = [];
      let questionResponses = [];
      let questionAreaAssessment = [];

      for (const competency of questionnaireFromDB.competencies) {
        const competencyCreated = await this.competency
          .schema(this.requestParams.schema_name)
          .create(
            {
              title: competency.title,
              description: competency.description,
              is_copy: true,
              no_of_questions: competency.no_of_questions,
              type: competency.type,
            },
            { transaction }
          );

        questionnaireCompetencies.push({
          questionnaire_id: questionnaire.id,
          competency_id: competencyCreated.id,
          no_of_questions:
            competency["QuestionnaireCompetency"]["no_of_questions"],
          is_copy: true,
        });

        for (const question of competency.questions) {
          const createdQuestion = await this.question
            .schema(this.requestParams.schema_name)
            .create(
              {
                text: question.text,
                response_type: question.response_type,
                competency_id: competencyCreated.id,
                is_copy: true,
                max_score: question.max_score,
              },
              { transaction }
            );

          questionnaireQuestions.push({
            questionnaire_id: questionnaire.id,
            question_id: createdQuestion.id,
            is_copy: true,
          });
          for (const areaAssessment of question.area_assessments) {
            questionAreaAssessment.push({
              question_id: createdQuestion.id,
              area_assessment_id: areaAssessment.id,
              is_copy: true,
            });
          }

          for (const response of question.responses) {
            questionResponses.push({
              type: response.type,
              label: response.label,
              score: response.score,
              question_id: createdQuestion.id,
              is_copy: true,
              order: response.order,
            });
          }
        }
      }

      await this.questionnaireCompetency
        .schema(this.requestParams.schema_name)
        .bulkCreate(questionnaireCompetencies, {
          transaction,
        });
      await this.questionnaireQuestion
        .schema(this.requestParams.schema_name)
        .bulkCreate(questionnaireQuestions, {
          transaction,
        });
      await this.questionResponse
        .schema(this.requestParams.schema_name)
        .bulkCreate(questionResponses, {
          transaction,
        });
      await this.questionAreaAssessment
        .schema(this.requestParams.schema_name)
        .bulkCreate(questionAreaAssessment, {
          transaction,
        });

      const tenant_metadata = await this.tenantMetaData
        .schema(DB_PUBLIC_SCHEMA)
        .findOne({
          where: {
            tenant_id: this.requestParams.tenant.id,
          },
        });

      const surveyDescription = await this.surveyDescription
        .schema(this.requestParams.schema_name)
        .create(
          {
            end_date: body.end_date,
            respondant_cut_off_date: body.respondant_cut_off_date,
            lm_approval_cut_off_date: body.lm_approval_cut_off_date,
            title: body.title,
            description: body.description,
            assessments_due: body.employees.length,
            total_assessments: body.employees.length,
            questionnaire_id: questionnaire.id,
            response_form: tenant_metadata.response_form,
            is_lm_approval_required:
              this.requestParams.tenant.is_lm_approval_required,
          },
          { transaction }
        );

      await this.tenantMetaData
        .schema(DB_PUBLIC_SCHEMA)
        .increment("ratee_count", {
          by: body.employees.length,
          where: {
            tenant_id: [
              this.requestParams.tenant.id,
              this.requestParams.tenant.parent_tenant_id,
            ],
          },
        });

      await this.tenantMetaData
        .schema(DB_PUBLIC_SCHEMA)
        .increment(["surveys_launched_count", "surveys_ongoing_count"], {
          where: {
            tenant_id: [
              this.requestParams.tenant.id,
              this.requestParams.tenant.parent_tenant_id,
            ],
          },
        });

      const raters = await this.rater
        .schema(this.requestParams.schema_name)
        .findAll({
          where: {
            survey_description_id: null,
          },
        });

      await this.rater.schema(this.requestParams.schema_name).bulkCreate(
        raters.map((rater) => ({
          name: rater.name,
          category_name: rater.category_name,
          short_name: rater.short_name,
          can_be_deleted: rater.can_be_deleted,
          is_external: rater.is_external,
          is_required: rater.is_required,
          no_of_raters: rater.no_of_raters,
          survey_description_id: surveyDescription.id,
        })),
        { transaction }
      );

      const survey = body.employees.map((item) => ({
        survey_id: surveyDescription.id,
        employee_id: item,
      }));

      await this.survey
        .schema(this.requestParams.schema_name)
        .bulkCreate(survey, { transaction });
      await transaction.commit();

      // employee passwords are created after they have been added in a survey by default all employees can't login
      await this.afterSurveyProcess(body, surveyDescription);
      return surveyDescription;
    } catch (error) {
      console.log(error);

      await transaction.rollback();
      throw error;
    }
  }

  async addResponedents(body: AddRespondents) {
    const transaction = await this.sequelize.transaction();
    try {
      const survey = await this.survey
        .schema(this.requestParams.schema_name)
        .findOne({
          where: { id: body.survey_id },
          include: [
            {
              model: SurveyDescription,
              attributes: ["title", "id", "is_lm_approval_required"],
            },
            {
              model: User,
              include: [
                {
                  model: User,
                  as: "line_manager",
                  attributes: ["id", "name", "email", "password"],
                },
                {
                  model: Designation,
                  attributes: ["name"],
                },
              ],
              attributes: ["name", "email", "is_lm_approval_required", "id"],
            },
          ],
        });

      if (!survey) throw new NotFoundException("Survey not found");

      const surveyRespondants = body.surveyRespondents.map((item) => ({
        survey_id: body.survey_id,
        respondant_id: item.respondant_id,
        relationship_with_employee_id: item.relationship_with_employee_id,
        is_selected_by_system: item.is_selected_by_system || false,
        is_approved_by_employee: item.is_approved_by_employee || true,
        is_approved_by_line_manager: item.is_approved_by_line_manager || false,
      }));
      let externalRespondantsEmails = [];
      const externalSurveyRespondants = body.externalSurveyRespondents.map(
        (item) => {
          externalRespondantsEmails.push(item.respondant_email);
          return {
            survey_id: body.survey_id,
            respondant_email: item.respondant_email,
            respondant_name: item.respondant_name,
            relationship_with_employee_id: item.relationship_with_employee_id,
            is_approved_by_employee: item.is_approved_by_employee || true,
            is_approved_by_line_manager:
              item.is_approved_by_line_manager || false,
          };
        }
      );

      const users = await this.user
        .schema(this.requestParams.schema_name)
        .findAll({
          where: {
            email: externalRespondantsEmails,
          },
        });

      if (users.length) {
        throw new BadRequestException(
          `Users with following emails already exits in your organization, they can not be added as external respondents. (${users
            .map((item) => item.email)
            .join(", ")})`
        );
      }
      const selfRater = await Rater.schema(
        this.requestParams.schema_name
      ).findOne({
        where: {
          name: "Self",
        },
        attributes: ["id"],
      });

      surveyRespondants.push({
        survey_id: body.survey_id,
        respondant_id: this.requestParams.getUser().id,
        relationship_with_employee_id: selfRater.id,
        is_selected_by_system: true,
        is_approved_by_employee: true,
        is_approved_by_line_manager: true,
      });

      await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .destroy({
          where: { survey_id: body.survey_id },
          transaction,
        });
      await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .destroy({
          where: { survey_id: body.survey_id },
          transaction,
        });
      await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .bulkCreate(surveyRespondants, {
          transaction,
        });
      await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .bulkCreate(externalSurveyRespondants, { transaction });

      if (!survey.employee.is_lm_approval_required) {
        await survey.update(
          {
            status: SurveyStatus.Ongoing,
            no_of_respondents:
              surveyRespondants.length + externalSurveyRespondants.length,
          },
          { transaction }
        );

        await this.surveyRespondant
          .schema(this.requestParams.schema_name)
          .update(
            {
              status: SurveyRespondantStatus.Ongoing,
              is_approved_by_employee: true,
              is_approved_by_line_manager: true,
            },
            {
              where: { survey_id: survey.id },
              transaction,
            }
          );
        await this.surveyExternalRespondant
          .schema(this.requestParams.schema_name)
          .update(
            {
              status: SurveyRespondantStatus.Ongoing,
              is_approved_by_employee: true,
              is_approved_by_line_manager: true,
            },
            {
              where: { survey_id: survey.id },
              transaction,
            }
          );
        await transaction.commit();
        this.launchSurvey(
          survey,
          body.survey_id,
          this.requestParams.schema_name
        );

        return;
      } else if (!survey.survey_description.is_lm_approval_required) {
        await survey.update(
          {
            status: SurveyStatus.Ongoing,
            no_of_respondents:
              surveyRespondants.length + externalSurveyRespondants.length,
          },
          { transaction }
        );
        await this.surveyRespondant
          .schema(this.requestParams.schema_name)
          .update(
            {
              status: SurveyRespondantStatus.Ongoing,
              is_approved_by_employee: true,
              is_approved_by_line_manager: true,
            },
            {
              where: { survey_id: survey.id },
              transaction,
            }
          );
        await this.surveyExternalRespondant
          .schema(this.requestParams.schema_name)
          .update(
            {
              status: SurveyRespondantStatus.Ongoing,
              is_approved_by_employee: true,
              is_approved_by_line_manager: true,
            },
            {
              where: { survey_id: survey.id },
              transaction,
            }
          );
        await transaction.commit();

        this.launchSurvey(
          survey,
          body.survey_id,
          this.requestParams.schema_name
        );
        return;
      } else {
        const survey = await this.survey
          .schema(this.requestParams.schema_name)
          .findOne({
            where: { id: body.survey_id },
          });
        await survey.update(
          {
            status: SurveyStatus.In_Progress,
            no_of_respondents:
              surveyRespondants.length + externalSurveyRespondants.length,
          },
          { transaction }
        );
        // await this.survey.update(
        //   {
        //     status: SurveyStatus.In_Progress,
        //     no_of_respondents:
        //       surveyRespondants.length + externalSurveyRespondants.length,
        //   },
        //   { where: { id: body.survey_id } }
        // );
        await this.surveyDescription
          .schema(this.requestParams.schema_name)
          .update(
            {
              status: SurveyDescriptionStatus.In_Progress,
              previous_status: SurveyDescriptionStatus.Initiated,
            },
            {
              where: {
                id: survey.survey_id,
              },
              transaction,
            }
          );
        await transaction.commit();

        const survey_description = await this.surveyDescription
          .schema(this.requestParams.schema_name)
          .findOne({
            where: {
              id: survey.survey_id,
            },
            include: [
              {
                model: Survey,
                include: [
                  {
                    model: SurveyDescription,
                    attributes: ["title", "id", "is_lm_approval_required"],
                  },
                  {
                    model: User,
                    include: [
                      {
                        model: User,
                        as: "line_manager",
                        attributes: ["id", "name", "email", "password"],
                      },
                      {
                        model: Designation,
                        attributes: ["name"],
                      },
                    ],
                    attributes: [
                      "name",
                      "email",
                      "is_lm_approval_required",
                      "id",
                    ],
                  },
                ],
              },
            ],
          });
        const required_users = survey_description?.surveys.filter(
          (item) => item.employee.is_lm_approval_required === true
        );

        const is_lm_approval_required = required_users.every((item) => {
          return item.status === "In Progress";
        });

        if (is_lm_approval_required) {
          await survey_description.update({
            status: SurveyDescriptionStatus.PendingApproval,
            previous_status: literal("status"),
          });
          for (const item of required_users) {
            let password = "";
            if (!item.employee.line_manager.password) {
              password = getRandomPassword();
              let hashPassword = await bcrypt.createHash(password);
              await item.employee.line_manager.update(
                {
                  password: hashPassword,
                }
                // { transaction }
              );
            }

            let Mail = {
              to: item.employee.line_manager.email,
              subject: `Respondent Nomination Approval Request | ${item.survey_description.title}`,
              context: {
                link: `${this.config.get("FE_URL")}/survey/approval-requests/${
                  item.survey_description.id
                }/${item.id}`,
                username: item.employee.line_manager.name,
                email: item.employee.line_manager.email,
                password,
                is_new_user: Boolean(password),
                requester: `${item.employee.name} ${
                  item.employee.designation
                    ? `(${item.employee.designation.name})`
                    : ""
                }`,
                survey_name: item.survey_description.title,
                logo: "cid:company-logo",
              },
              attachments: [
                {
                  filename: "company-logo",
                  path: "src/public/media/images/company-logo.png",
                  cid: "company-logo",
                },
              ],
            };

            this.mailsService.RespondentApprovalRequestMail(Mail);
          }
        }
      }

      return "Respondents added successfully";
    } catch (error) {
      await transaction.rollback();
      console.log(error);

      throw error;
    }
  }

  async approveRespondent(id: string, body: ApproveRespondentDTO) {
    const transaction = await this.sequelize.transaction();
    try {
      let respondent;
      if (body.is_external) {
        respondent = await this.surveyExternalRespondant
          .schema(this.requestParams.schema_name)
          .findOne({
            where: { id },
          });
      } else {
        respondent = await this.surveyRespondant
          .schema(this.requestParams.schema_name)
          .findOne({ where: { id } });
      }

      if (!respondent) throw new NotFoundException("Respondent Not Found");
      if (body.is_external) {
        await this.surveyExternalRespondant
          .schema(this.requestParams.schema_name)
          .update(
            {
              is_approved_by_employee: true,
              is_approved_by_line_manager: true,
              respondant_name: body.alternative_name,
              respondant_email: body.alternative_email,
            },
            { where: { id }, transaction }
          );
      } else {
        await this.surveyRespondant
          .schema(this.requestParams.schema_name)
          .update(
            {
              respondant_id: body.alternative
                ? body.alternative
                : respondent.respondant_id,
              is_approved_by_employee: true,
              is_approved_by_line_manager: true,
            },
            { where: { id }, transaction }
          );
      }
      await transaction.commit();
      return "Respondent approved successfully";
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async alternativeRespondent(body: AlternativeRespondentDTO, id: string) {
    const transaction = await this.sequelize.transaction();
    try {
      let respondent = await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .findOne({ where: { id } });

      if (!respondent) throw new NotFoundException("Respondent Not Found");

      const log = await this.surveySuggestionsLogs
        .schema(this.requestParams.schema_name)
        .create(
          {
            suggested_by: body.suggested_by,
            comments: body.comments,
            alternative_suggestion_id: body.alternative_suggestion_id,
            survey_respondant_id: id,
          },
          { transaction }
        );

      await this.surveyRespondant.schema(this.requestParams.schema_name).update(
        {
          last_suggestion_id: log.id,
          is_approved_by_line_manager:
            body.suggested_by === SuggestedByOptions.LINE_MANAGER
              ? false
              : respondent.is_approved_by_line_manager,
          is_approved_by_employee:
            body.suggested_by === SuggestedByOptions.EMPLOYEE
              ? false
              : respondent.is_approved_by_employee,
        },
        { where: { id }, transaction }
      );
      await transaction.commit();
      return "Alternative Respondent added successfully";
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async alternativeExternalRespondent(
    body: AlternativeExternalRespondentDTO,
    id: string
  ) {
    const transaction = await this.sequelize.transaction();
    try {
      let respondent = await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .findOne({
          where: { id },
        });

      if (!respondent) throw new NotFoundException("Respondent Not Found");

      const users = await this.user
        .schema(this.requestParams.schema_name)
        .findAll({
          where: {
            email: body.alternative_email,
          },
        });

      if (users.length) {
        throw new BadRequestException(
          `User with following email already exits in your organization, it can not be added as external respondent. (${body.alternative_email})`
        );
      }

      const log = await this.surveySuggestionsLogs
        .schema(this.requestParams.schema_name)
        .create(
          {
            suggested_by: body.suggested_by,
            comments: body.comments,
            alternative_email: body.alternative_email,
            alternative_name: body.alternative_name,
            external_survey_respondant_id: respondent.id,
          },
          { transaction }
        );

      await respondent.update(
        {
          last_suggestion_id: log.id,
          is_approved_by_line_manager:
            body.suggested_by === SuggestedByOptions.LINE_MANAGER
              ? false
              : respondent.is_approved_by_line_manager,
          is_approved_by_employee:
            body.suggested_by === SuggestedByOptions.EMPLOYEE
              ? false
              : respondent.is_approved_by_employee,
        },
        { transaction }
      );

      return "Alternative Respondent added successfully";
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async sendSuggestion(body: SendSuggestionDTO, id: string) {
    try {
      const survey = await this.survey
        .schema(this.requestParams.schema_name)
        .findOne({
          where: { id },
          include: [
            {
              model: User,
              attributes: ["name", "email", "id"],
              include: [
                {
                  model: Designation,
                  attributes: ["name"],
                },
                {
                  model: User,
                  attributes: ["name", "email", "password"],
                  as: "line_manager",
                },
              ],
            },
            {
              model: SurveyDescription,
              attributes: ["title", "id"],
            },
          ],
        });

      if (!survey) throw new NotFoundException("Survey not found");

      await survey.update({
        status: body.status,
      });
      if (body.status === SurveyStatus.Ongoing) {
        this.launchSurvey(survey, id, this.requestParams.schema_name);
        return "Survey Launche successfully";
      } else {
        if (survey.employee_id === this.requestParams.getUser().id) {
          let password = "";

          if (!survey.employee.line_manager.password) {
            password = getRandomPassword();
            let hashPassword = await bcrypt.createHash(password);
            await survey.employee.line_manager.update({
              password: hashPassword,
            });
          }
          let Mail = {
            to: survey.employee.line_manager.email,
            subject: `Approval Request for Alternate Nomination | ${survey.survey_description.title}`,
            context: {
              link: `${this.config.get("FE_URL")}/survey/approval-requests/${
                survey.survey_description.id
              }/${survey.id}`,
              username: survey.employee.line_manager.name,
              email: survey.employee.line_manager.email,
              password,
              is_new_user: Boolean(password),
              logo: "cid:company-logo",
              requester: `${survey.employee.name} (${survey.employee.designation.name})`,
              survey_name: survey.survey_description.title,
              from_user: true,
              ...defaultContext,
            },
            attachments: [
              {
                filename: "company-logo",
                path: "src/public/media/images/company-logo.png",
                cid: "company-logo",
              },
            ],
          };
          this.mailsService.AlternativeSuggestionRequestMail(Mail);
        } else {
          let Mail = {
            to: survey.employee.email,
            subject: `Alternate Respondent suggested by Line Manager | ${survey.survey_description.title}`,
            context: {
              link: `${this.config.get("FE_URL")}/survey/approval-requests/${
                survey.survey_description.id
              }/${survey.id}`,
              username: survey.employee.line_manager.name,
              logo: "cid:company-logo",
              requester: `${survey.employee.name} (${survey.employee.designation.name})`,
              survey_name: survey.survey_description.title,
              from_user: true,
              ...defaultContext,
            },
            attachments: [
              {
                filename: "company-logo",
                path: "src/public/media/images/company-logo.png",
                cid: "company-logo",
              },
              ...defaultAttachments,
            ],
          };
          this.mailsService.AlternativeSuggestionRequestMail(Mail);
        }
      }

      return "Survey sent successfully";
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async submitSurveyold(body: any) {
    const transaction = await this.sequelize.transaction();
    try {
      const token: any = await this.jwtService.decode(body.token);
      const tenant = await this.tenant.schema(DB_PUBLIC_SCHEMA).findOne({
        where: {
          schema_name: token.schema_name,
        },
      });
      let surveyRespondant;

      if (token.is_external) {
        surveyRespondant = await this.surveyExternalRespondant
          .schema(token.schema_name)
          .findOne({
            where: { id: token.id },
          });
      } else {
        surveyRespondant = await this.surveyRespondant
          .schema(token.schema_name)
          .findOne({
            where: { id: token.id },
          });
      }

      const survey = await this.survey.schema(token.schema_name).findOne({
        where: {
          id: surveyRespondant.survey_id,
        },
        include: [{ model: User, attributes: ["name", "email"] }],
      });

      if (!survey || survey.status !== SurveyStatus.Ongoing)
        throw new NotFoundException("Survey Not Found");

      let data = [];

      for (const item of body.surveyResponses) {
        if (item.question_type === QuestionResponseOptions.multiple_choice) {
          for (const resp of item.response_ids) {
            data.push({
              survey_id: survey.id,
              survey_respondant_id: token.is_external
                ? null
                : surveyRespondant.id,
              question_id: item.question_id,
              response_text: item.response_text,
              response_id: resp,
              survey_external_respondant_id: token.is_external
                ? surveyRespondant.id
                : null,
              consider_in_report: item.consider_in_report,
              category_id: surveyRespondant?.relationship_with_employee_id,
            });
          }
        } else {
          data.push({
            survey_id: survey.id,
            survey_respondant_id: token.is_external
              ? null
              : surveyRespondant.id,
            question_id: item.question_id,
            response_text: item.response_text,
            response_id:
              item.question_type === QuestionResponseOptions.text
                ? null
                : item.response_id,
            survey_external_respondant_id: token.is_external
              ? surveyRespondant.id
              : null,
            consider_in_report: item.consider_in_report,
            category_id: surveyRespondant?.relationship_with_employee_id,
          });
        }
      }

      const destroyWhere = token.is_external
        ? { survey_external_respondant_id: surveyRespondant.id }
        : { survey_respondant_id: surveyRespondant.id };

      const competencyComments: any = Object.entries(
        body.competencyComments
      ).map(([key, value]) => ({
        competency_id: key,
        comments: value,
        survey_id: survey.id,
        survey_respondent_id: token.is_external
          ? undefined
          : surveyRespondant.id,
        survey_external_respondent_id: token.is_external
          ? surveyRespondant.id
          : undefined,
      }));

      await this.surveyResponse
        .schema(token.schema_name)
        .destroy({ where: destroyWhere, transaction });
      await this.surveyResponse
        .schema(token.schema_name)
        .bulkCreate(data, { transaction });
      await this.competencyComment.schema(token.schema_name).destroy({
        where: {
          [Op.or]: [
            { survey_respondent_id: surveyRespondant.id },
            { survey_external_respondent_id: surveyRespondant.id },
          ],
        },
        transaction,
      });
      await this.competencyComment
        .schema(token.schema_name)
        .bulkCreate(competencyComments, {
          transaction,
        });

      this.afterSurveySubmitionProcessOld(
        body,
        surveyRespondant,
        survey,
        token,
        tenant
      );
      await transaction.commit();
      return "Survey submited successfully";
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async launchSurvey(survey: any, id: string, schema_name: string) {
    // const tenant = await this.tenantMetaData.schema(DB_PUBLIC_SCHEMA).findOne({
    //   where: {
    //     tenant_id: this.requestParams.tenant.id,
    //   },

    // });

    const surveyDescription = await this.surveyDescription
      .schema(schema_name)
      .findOne({
        where: {
          id: survey.survey_id,
        },

        include: [
          {
            model: Survey,
          },
        ],
      });
    if (surveyDescription?.response_form === "Multiple Ratee") {
      try {
        const surveys = await this.survey.schema(schema_name).count({
          where: {
            status: SurveyStatus.Ongoing,
            survey_id: survey.survey_id,
          },
        });

        if (surveyDescription.total_assessments === surveys) {
          await surveyDescription.update({
            status: SurveyDescriptionStatus.Ongoing,
            previous_status: literal("status"),
          });
          await this.tenantMetaData
            .schema(DB_PUBLIC_SCHEMA)
            .increment("rater_count", {
              by: survey.no_of_respondents,
              where: {
                tenant_id: [
                  this.requestParams.tenant.id,
                  this.requestParams.tenant.parent_tenant_id,
                ],
              },
            });

          const respondents = await this.surveyRespondant
            .schema(schema_name)
            .findAll({
              include: [
                {
                  attributes: [],
                  model: Survey,
                  where: {
                    survey_id: surveyDescription.id,
                  },
                },
                {
                  model: User,
                  attributes: ["name", "email", "id"],
                },
                { model: Rater },
              ],
            });
          const externalRespondants = await this.surveyExternalRespondant
            .schema(schema_name)
            .unscoped()
            .findAll({
              include: [
                {
                  attributes: [],
                  model: Survey,
                  where: {
                    survey_id: surveyDescription.id,
                  },
                },
              ],
            });
          const maxLength = Math.max(
            respondents.length,
            externalRespondants.length
          );

          let alreadySent = [];
          let alreadySentExternal = [];
          let tokens = [];

          for (let index = 0; index < maxLength; index++) {
            const url = "multiple";
            if (
              respondents[index] &&
              !alreadySent.includes(respondents[index].respondant.email)
            ) {
              await this.sendToRepondent(
                respondents[index],
                survey,
                tokens,
                url
              );
              alreadySent.push(respondents[index].respondant.email);
            }

            if (
              externalRespondants[index] &&
              !alreadySentExternal.includes(
                externalRespondants[index].respondant_email
              )
            ) {
              await this.sendToExternalRespondent(
                externalRespondants[index],
                survey,
                tokens,
                url
              );
              alreadySentExternal.push(
                externalRespondants[index].respondant_email
              );
            }
          }
          this.mailsService.sendTokens(tokens);
        }

        await this.surveyRespondant.schema(schema_name).update(
          {
            status: SurveyRespondantStatus.Ongoing,
            is_approved_by_employee: true,
            is_approved_by_line_manager: true,
          },
          {
            where: { survey_id: id },
          }
        );
        await this.surveyExternalRespondant.schema(schema_name).update(
          {
            status: SurveyRespondantStatus.Ongoing,
            is_approved_by_employee: true,
            is_approved_by_line_manager: true,
          },
          {
            where: { survey_id: id },
          }
        );
      } catch (error) {
        throw error;
      }
    } else {
      try {
        const surveys = await this.survey.schema(schema_name).count({
          where: {
            status: SurveyStatus.Ongoing,
            survey_id: survey.survey_id,
          },
        });
        if (surveyDescription.total_assessments === surveys) {
          this.surveyDescription.schema(schema_name).update(
            {
              status: SurveyDescriptionStatus.Ongoing,
            },
            {
              where: {
                id: survey.survey_id,
              },
            }
          );

          await this.tenantMetaData
            .schema(DB_PUBLIC_SCHEMA)
            .increment("rater_count", {
              by: survey.no_of_respondents,
              where: {
                tenant_id: [
                  this.requestParams.tenant.id,
                  this.requestParams.tenant.parent_tenant_id,
                ],
              },
            });
          for (const element of surveyDescription.surveys) {
            if (element.status === "Ongoing") {
              const respondents = await this.surveyRespondant
                .schema(schema_name)
                .findAll({
                  where: { survey_id: element.id },
                  attributes: ["id"],
                  include: [
                    {
                      model: User,
                      attributes: ["name", "email", "id"],
                    },
                    {
                      model: Rater,
                      attributes: ["category_name"],
                    },
                  ],
                });

              const externalRespondents = await this.surveyExternalRespondant
                .schema(schema_name)
                .findAll({
                  where: { survey_id: element.id },
                  attributes: ["id", "respondant_email", "respondant_name"],
                  include: [
                    {
                      model: Rater,
                      attributes: ["category_name"],
                    },
                  ],
                });

              const maxLength = Math.max(
                respondents.length,
                externalRespondents.length
              );

              let tokens = [];
              for (let index = 0; index < maxLength; index++) {
                const url = "single";
                if (respondents[index]) {
                  await this.sendToRepondent(
                    respondents[index],
                    survey,
                    tokens,
                    url
                  );
                }
                if (externalRespondents[index]) {
                  await this.sendToExternalRespondent(
                    externalRespondents[index],
                    survey,
                    tokens,
                    url
                  );
                }
              }

              this.mailsService.sendTokens(tokens);
            }
            await this.surveyRespondant.schema(schema_name).update(
              {
                status: SurveyRespondantStatus.Ongoing,
                is_approved_by_employee: true,
                is_approved_by_line_manager: true,
              },
              {
                where: { survey_id: element.id },
              }
            );
            await this.surveyExternalRespondant.schema(schema_name).update(
              {
                status: SurveyRespondantStatus.Ongoing,
                is_approved_by_employee: true,
                is_approved_by_line_manager: true,
              },
              {
                where: { survey_id: element.id },
              }
            );
          }
        }
      } catch (error) {
        throw error;
      }
    }
  }

  async sendToRepondent(
    resp: SurveyRespondant,
    survey: Survey,
    tokens?: string[],
    url?: string
  ) {
    const token = await this.jwtService.signAsync({
      id: resp.respondant_id,
      respondant_id: resp.id,
      survey_id: survey.survey_id,
      schema_name: this.requestParams.tenant.schema_name,
      is_external: false,
    });
    if (tokens) {
      tokens.push(token);
    }

    let Mail = {
      to: resp.respondant.email,
      subject: `Request to fill feedback survey | ${survey.survey_description.title}`,
      context: {
        link: `${this.config.get("FE_URL")}/survey/assessment/${url}/${token}`,
        username: resp.respondant.name,
        logo: "cid:company-logo",
        survey_name: survey.survey_description.title,
      },
      attachments: [
        {
          filename: "company-logo",
          path: "src/public/media/images/company-logo.png",
          cid: "company-logo",
        },
      ],
    };

    await this.mailsService.SurveyMail(Mail);
  }

  async sendToExternalRespondent(
    resp: SurveyExternalRespondant,
    survey: Survey,
    tokens?: string[],
    url?: any
  ) {
    const token = await this.jwtService.signAsync({
      email: resp.respondant_email,
      schema_name: this.requestParams.tenant.schema_name,
      is_external: true,
      survey_id: survey.survey_id,
      respondant_id: resp.id,
    });

    if (tokens) {
      tokens.push(token);
    }
    let Mail = {
      to: resp.respondant_email,
      subject: `Request to fill feedback survey | ${survey.survey_description.title}`,
      context: {
        link: `${this.config.get("FE_URL")}/survey/assessment/${url}/${token}`,
        username: resp.respondant_name,
        logo: "cid:company-logo",
        survey_name: survey.survey_description.title,
      },
      attachments: [
        {
          filename: "company-logo",
          path: "src/public/media/images/company-logo.png",
          cid: "company-logo",
        },
      ],
    };

    await this.mailsService.SurveyMail(Mail);
  }

  async afterSurveyProcess(
    body: CreateSurveyDTO,
    surveyDescription: SurveyDescription
  ) {
    let usersWithoutPassword = await this.user
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          id: body.employees,
          password: null,
        },
        attributes: ["id", "email", "password"],
      });

    let usersWithPassword = await this.user
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          id: body.employees,
          password: {
            [Op.ne]: null,
          },
        },
        attributes: ["id", "email", "password"],
      });

    for (const user of usersWithPassword) {
      let Mail = {
        to: user.email,
        subject: `Request to nominate Respondents | New Survey Created | ${surveyDescription.title}`,
        context: {
          email: user.email,
          is_already_created: true,
          is_lm_approval_req: !user.is_lm_approval_required
            ? false
            : !surveyDescription.is_lm_approval_required
            ? false
            : true,
          is_tenant: false,
          system_link: `${this.config.get(
            "FE_URL"
          )}/survey/my/nominate-respondents`,
          be_link: this.config.get("BE_URL"),
          logo: "cid:company-logo",
        },
        attachments: [
          {
            filename: "company-logo",
            path: "src/public/media/images/company-logo.png",
            cid: "company-logo",
          },
        ],
      };

      this.mailsService.TenantRegisterMail(Mail);
    }

    for (const user of usersWithoutPassword) {
      const password = getRandomPassword();
      let hashPassword = await bcrypt.createHash(password);
      await user.update({
        password: hashPassword,
      });

      let Mail = {
        to: user.email,
        subject: `Request to nominate Respondents | New Survey Created | ${surveyDescription.title}`,
        context: {
          email: user.email,
          password,
          is_already_created: false,
          is_lm_approval_req: !user.is_lm_approval_required
            ? false
            : !surveyDescription.is_lm_approval_required
            ? false
            : true,
          is_tenant: false,
          system_link: `${this.config.get(
            "FE_URL"
          )}/survey/my/nominate-respondents`,
          be_link: this.config.get("BE_URL"),
          logo: "cid:company-logo",
        },
        attachments: [
          {
            filename: "company-logo",
            path: "src/public/media/images/company-logo.png",
            cid: "company-logo",
          },
        ],
      };

      this.mailsService.TenantRegisterMail(Mail);
    }

    await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).create({
      type: TenantHistoryTypes.ongoing_survey,
      reference_id: surveyDescription.id,
      tenant_id: this.requestParams.tenant.id,
      group: TenantHistoryGroup.survey,
    });
  }

  async afterSurveySubmitionProcessOld(
    body: SubmitSurveyDTO,
    surveyRespondant: SurveyRespondant | SurveyExternalRespondant,
    survey: Survey,
    token: any,
    tenant: Tenant
  ) {
    if (body.status === SurveyStatus.Completed) {
      await surveyRespondant.update({
        status: SurveyRespondantStatus.Completed,
        response_date: moment().format(),
      });

      await this.tenantMetaData
        .schema(DB_PUBLIC_SCHEMA)
        .increment("surveys_completed_count", {
          where: {
            tenant_id: [tenant.id, tenant.parent_tenant_id],
          },
        });
      await this.tenantMetaData
        .schema(DB_PUBLIC_SCHEMA)
        .decrement("surveys_ongoing_count", {
          where: {
            tenant_id: [tenant.id, tenant.parent_tenant_id],
          },
        });

      if (survey.completed_surveys + 1 === survey.no_of_respondents) {
        await survey.update({
          completed_surveys: survey.completed_surveys + 1,
          status: SurveyStatus.Completed,
          previous_status: literal("status"),
        });

        const surveyDescription = await this.surveyDescription
          .schema(token.schema_name)
          .findOne({
            where: {
              id: survey.survey_id,
            },
          });

        let surveyDescriptionBody = {
          assessments_completed: literal("assessments_completed + 1"),
          assessments_due: literal("assessments_due - 1"),
        };

        if (
          surveyDescription.assessments_completed + 1 ===
          surveyDescription.total_assessments
        ) {
          surveyDescriptionBody["status"] = SurveyDescriptionStatus.Completed;
          surveyDescriptionBody["previous_status"] = literal("status");
          await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).update(
            { type: TenantHistoryTypes.completed_survey },
            {
              where: { reference_id: surveyDescription.id },
            }
          );
          await surveyDescription.update(surveyDescriptionBody);
          await this.setBenchmark(
            surveyDescription.questionnaire_id,
            token.schema_name
          );
          await this.reportService.genrateReport(surveyDescription.id, token);
          return "Reports created successfully";
        }
        await surveyDescription.update(surveyDescriptionBody);
      } else {
        await survey.update({
          completed_surveys: survey.completed_surveys + 1,
        });
      }
    } else {
      await surveyRespondant.update({
        status: SurveyRespondantStatus.Ongoing,
      });
    }
  }

  async updateSurvey(id: string, body: UpdateSurveyDTO) {
    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id },
      });

    if (!surveyDescription) throw new NotFoundException("Survey not found");

    await surveyDescription.update({
      ...body,
      previous_status: literal("status"),
    });

    if (body.status === SurveyDescriptionStatus.Terminated) {
      const survey = await this.survey
        .schema(this.requestParams.schema_name)
        .findOne({
          where: { survey_id: id },
        });
      await survey.update({
        status: SurveyStatus.Terminated,
      });

      await this.tenantMetaData
        .schema(DB_PUBLIC_SCHEMA)
        .increment("surveys_terminated_count", {
          where: {
            tenant_id: [
              this.requestParams.tenant.id,
              this.requestParams.tenant.parent_tenant_id,
            ],
          },
        });
      await this.tenantMetaData
        .schema(DB_PUBLIC_SCHEMA)
        .decrement("surveys_ongoing_count", {
          where: {
            tenant_id: [
              this.requestParams.tenant.id,
              this.requestParams.tenant.parent_tenant_id,
            ],
          },
        });
    }
  }

  async updateDatesOfSurvey(id: string, body: UpdateSurveyDTO) {
    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id },
      });
    if (!surveyDescription) throw new NotFoundException("Survey not found");

    if (body?.field === "respondant_cut_off_date") {
      if (
        moment(body?.respondant_cut_off_date).isAfter(
          moment(surveyDescription.lm_approval_cut_off_date)
        )
      ) {
        throw new BadRequestException(
          "Respondant Cut off Date must be less than LM approval cut off date"
        );
      }
      await surveyDescription.update({
        respondant_cut_off_date: body.respondant_cut_off_date,
      });

      if (
        moment(new Date()).isBefore(body?.respondant_cut_off_date) &&
        surveyDescription.status === SurveyDescriptionStatus.Onhold
      ) {
        await surveyDescription.update({
          previous_status: literal("status"),
          status: surveyDescription.previous_status,
        });
        await this.survey.schema(this.requestParams.schema_name).update(
          {
            status: literal("previous_status"),
            previous_status: literal("status"),
          },
          { where: { survey_id: surveyDescription.id } }
        );
      }
    }

    if (body?.field === "lm_approval_cut_off_date") {
      if (
        moment(body?.lm_approval_cut_off_date).isAfter(
          moment(surveyDescription.end_date)
        )
      ) {
        throw new BadRequestException(
          "LM approval cut off date must be less than Survey end date"
        );
      }
      await surveyDescription.update({
        lm_approval_cut_off_date: body.lm_approval_cut_off_date,
      });

      if (
        moment(new Date()).isBefore(body?.lm_approval_cut_off_date) &&
        surveyDescription.status === SurveyDescriptionStatus.Onhold
      ) {
        await surveyDescription.update({
          previous_status: literal("status"),
          status: surveyDescription.previous_status,
        });
        await this.survey.schema(this.requestParams.schema_name).update(
          {
            status: literal("previous_status"),
            previous_status: literal("status"),
          },
          { where: { survey_id: surveyDescription.id } }
        );
      }
    }

    if (body?.field === "end_date") {
      if (
        moment(body?.end_date).isBefore(
          moment(surveyDescription.lm_approval_cut_off_date)
        )
      ) {
        throw new BadRequestException(
          "Survey end date must be greater than LM approval cut off date"
        );
      }
      await surveyDescription.update({
        end_date: body.end_date,
      });

      if (
        moment(moment()).isBefore(body?.end_date) &&
        surveyDescription.status === SurveyDescriptionStatus.Closed
      ) {
        await surveyDescription.update({
          previous_status: literal("status"),
          status: surveyDescription.previous_status,
        });
        await this.survey.schema(this.requestParams.schema_name).update(
          {
            status: literal("previous_status"),
            previous_status: literal("status"),
          },
          { where: { survey_id: surveyDescription.id } }
        );
      }
    }

    return "Dates updated successfully";
  }

  async setBenchmark(questionnaire_id: string, schema_name?: string) {
    const questions = await this.question
      .schema(schema_name || this.requestParams.schema_name)
      .findAll({
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
            attributes: ["id"],
            include: [
              {
                model: Rater,
                where: { name: { [Op.ne]: "Self" } },
                attributes: [],
              },
              {
                model: QuestionResponse,
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
              score:
                benchmark[question.competency_id].score + resp.response.score,
            }
          : { score: resp.response.score, count: 1 };
      }
    }

    for (const [key, value] of Object.entries({ ...benchmark }) as any) {
      await this.competency
        .schema(schema_name || this.requestParams.schema_name)
        .update(
          { benchmark: +(value.score / value.count).toFixed(2) },
          { where: { id: key, is_copy: true } }
        );
    }

    return "Done";
  }

  async getUsersByFilter(data: SurveyFilterDTO) {
    let query: any = [{ line_manager_id: { [Op.ne]: null } }];
    if (data.departments && data.departments.length) {
      query.push({ department_id: data.departments });
    }
    if (data.designations && data.designations.length) {
      query.push({ designation_id: data.designations });
    }
    if (data.text && data.text.length) {
      query.push({
        [Op.or]: [
          { email: { [Op.iLike]: `%${data.text}%` } },
          { name: { [Op.iLike]: `%${data.text}%` } },
        ],
      });
    }
    const users = await this.user
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          [Op.and]: query,
        },
        attributes: [
          "name",
          "id",
          "department_id",
          "designation_id",
          "email",
          "contact",
          "region",
        ],
        include: [
          {
            model: Department,
            attributes: ["name", "id"],
          },
          {
            model: Designation,
            attributes: ["name", "id"],
          },
          {
            model: User,
            as: "line_manager",
            attributes: ["name", "id", "email"],
          },
        ],
      });
    return users;
  }

  async genrateReports(id: string) {
    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          id,
          status: SurveyDescriptionStatus.Closed,
        },
      });

    if (!surveyDescription) throw new NotFoundException("Survey Not Found");

    const surveys = await this.survey
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          survey_id: id,
          completed_surveys: {
            [Op.gte]: 2,
          },
        },
        include: [
          {
            model: User,
            attributes: ["name", "email", "id"],
            include: [
              {
                model: User,
                as: "line_manager",
              },
            ],
          },
          {
            model: SurveyDescription,
            attributes: ["id", "title"],
          },
        ],
      });

    if (!surveys.length) {
      throw new BadRequestException(
        "Responses gathered are sufficient to generate a report. Atleast 2 unique responses required"
      );
    }
    await this.setBenchmark(surveyDescription.questionnaire_id);
    for (const survey of surveys) {
      let userToken = await this.jwtService.signAsync({
        id: survey.employee_id,
      });
      let surveyToken = await this.jwtService.signAsync({
        survey_id: survey.id,
        schema_name: this.requestParams.schema_name,
        token: userToken,
      });

      let Mail = {
        to: survey.employee.email,
        cc: survey?.employee?.line_manager?.email,
        subject: `Survey Completion Report | ${survey.survey_description.title}`,
        context: {
          link: `${this.config.get(
            "BE_URL"
          )}/api/v1/reports/single-response-report/${surveyToken}`,
          username: survey.employee.name,
          logo: "cid:company-logo",
        },
        attachments: [
          {
            filename: "company-logo",
            path: "src/public/media/images/company-logo.png",
            cid: "company-logo",
          },
        ],
      };
      this.mailsService.ReportsMail(Mail);
      await survey.update({
        status: SurveyStatus.Completed,
      });
    }

    surveyDescription.update({
      status: SurveyDescriptionStatus.Completed,
      previous_status: literal("status"),
    });
  }

  async submitSurvey(body: SubmitSurveyDTO) {
    const transaction = await this.sequelize.transaction();
    try {
      const token: any = await this.jwtService.decode(body.token);
      // await this.sequelize.query(`set search_path to ${token.schema_name};`);
      let respondants = [];
      let surveyIds = [];
      for (const survey of body.surveyResponses) {
        let data = [];
        surveyIds.push(survey.survey_id);
        for (const response of survey.responses) {
          if (
            response.question_type === QuestionResponseOptions.multiple_choice
          ) {
            for (const resp of response.response_ids) {
              data.push({
                ...response,
                response_id: resp,
                survey_respondant_id: token.is_external
                  ? null
                  : response.survey_respondant_id,
                survey_external_respondant_id: token.is_external
                  ? response.survey_external_respondant_id
                  : null,
              });
            }
          } else {
            if (response.response_id || response.response_text) {
              data.push({
                ...response,
                survey_respondant_id: token.is_external
                  ? null
                  : response.survey_respondant_id,
                survey_external_respondant_id: token.is_external
                  ? response.survey_external_respondant_id
                  : null,
                response_id:
                  response.question_type === QuestionResponseOptions.text
                    ? null
                    : response.response_id,
              });
            }
          }
        }

        const destroyWhere = token.is_external
          ? {
              survey_external_respondant_id:
                survey.survey_external_respondant_id,
            }
          : { survey_respondant_id: survey.respondent_id };

        respondants.push(
          token.is_external
            ? survey.survey_external_respondant_id
            : survey.respondent_id
        );
        await this.surveyResponse
          .schema(token.schema_name)
          .destroy({ where: destroyWhere, transaction });
        await this.surveyResponse
          .schema(token.schema_name)
          .bulkCreate(data, { transaction });
      }

      await this.competencyComment.schema(token.schema_name).destroy({
        where: {
          [Op.or]: [
            {
              survey_respondent_id: [
                ...new Set(
                  body.competencyComments.map(
                    (item) => item.survey_respondent_id
                  )
                ),
              ] as string[],
            },
            {
              survey_external_respondent_id: [
                ...new Set(
                  body.competencyComments.map(
                    (item) => item.survey_external_respondent_id
                  )
                ),
              ] as string[],
            },
          ],
        },
      });

      await this.competencyComment
        .schema(token.schema_name)
        .bulkCreate(body.competencyComments, {
          transaction,
        });
      await transaction.commit();

      this.afterSurveySubmitionProcess(body, respondants, surveyIds, token);
      return "Survey submited successfully";
    } catch (error) {
      console.log(error);

      await transaction.rollback();
      throw error;
    }
  }

  async submitSurveyForSingleRatee(body: SubmitSingleSurveyDTO) {
    const transaction = await this.sequelize.transaction();
    try {
      const token: any = await this.jwtService.decode(body.token);
      const tenant = await this.tenant.schema(DB_PUBLIC_SCHEMA).findOne({
        where: {
          schema_name: token.schema_name,
        },
      });

      let surveyRespondant;

      if (token.is_external) {
        surveyRespondant = await this.surveyExternalRespondant
          .schema(token.schema_name)
          .findOne({
            where: { id: token.respondant_id },
          });
      } else {
        surveyRespondant = await this.surveyRespondant
          .schema(token.schema_name)
          .findOne({
            where: { id: token.respondant_id },
          });
      }

      const survey = await this.survey.schema(token.schema_name).findOne({
        where: {
          id: surveyRespondant.survey_id,
        },
        include: [{ model: User, attributes: ["name", "email"] }],
      });

      if (!survey || survey.status !== SurveyStatus.Ongoing)
        throw new NotFoundException("Survey Not Found");

      let data = [];

      for (const item of body.surveyResponses) {
        if (item.question_type === QuestionResponseOptions.multiple_choice) {
          for (const resp of item.response_ids) {
            data.push({
              survey_id: survey.id,
              survey_respondant_id: token.is_external
                ? null
                : surveyRespondant.id,
              question_id: item.question_id,
              response_text: item.response_text,
              response_id: resp,
              survey_external_respondant_id: token.is_external
                ? surveyRespondant.id
                : null,
              consider_in_report: item.consider_in_report,
              category_id: surveyRespondant?.relationship_with_employee_id,
            });
          }
        } else {
          data.push({
            survey_id: survey.id,
            survey_respondant_id: token.is_external
              ? null
              : surveyRespondant.id,
            question_id: item.question_id,
            response_text: item.response_text,
            response_id:
              item.question_type === QuestionResponseOptions.text
                ? null
                : item.response_id,
            survey_external_respondant_id: token.is_external
              ? surveyRespondant.id
              : null,
            consider_in_report: item.consider_in_report,
            category_id: surveyRespondant?.relationship_with_employee_id,
          });
        }
      }

      const destroyWhere = token.is_external
        ? { survey_external_respondant_id: surveyRespondant.id }
        : { survey_respondant_id: surveyRespondant.id };

      const competencyComments = Object.entries(body.competencyComments).map(
        ([key, value]) => ({
          competency_id: key,
          comments: value,
          survey_id: survey.id,
          survey_respondent_id: token.is_external
            ? undefined
            : surveyRespondant.id,
          survey_external_respondent_id: token.is_external
            ? surveyRespondant.id
            : undefined,
        })
      );

      await this.surveyResponse
        .schema(token.schema_name)
        .destroy({ where: destroyWhere, transaction });
      await this.surveyResponse
        .schema(token.schema_name)
        .bulkCreate(data, { transaction });
      await this.competencyComment.schema(token.schema_name).destroy({
        where: {
          [Op.or]: [
            { survey_respondent_id: surveyRespondant.id },
            { survey_external_respondent_id: surveyRespondant.id },
          ],
        },
        transaction,
      });
      await this.competencyComment
        .schema(token.schema_name)
        .bulkCreate(competencyComments, {
          transaction,
        });

      await transaction.commit();
      this.afterSurveySubmitionProcessForSingleRatee(
        body,
        surveyRespondant,
        survey,
        token,
        tenant
      );
      return "Survey submited successfully";
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async afterSurveySubmitionProcess(
    body: SubmitSurveyDTO,
    respondants: string[],
    surveyIds: string[],
    token: any
  ) {
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
            id: surveyIds,
          },
          include: [
            {
              model: SurveyExternalRespondant.schema(token.schema_name),
              required: false,
              where: {
                status: SurveyRespondantStatus.Completed,
              },
            },
            {
              model: SurveyRespondant.schema(token.schema_name),
              required: false,
              where: {
                status: SurveyRespondantStatus.Completed,
              },
            },
          ],
        });
        let completedCount = 0;
        for (const survey of surveys) {
          if (
            survey.no_of_respondents ===
            survey.survey_respondants.length +
              survey.survey_external_respondants.length
          ) {
            await survey.update({ status: SurveyStatus.Completed });
            completedCount++;
          }
        }
        const surveyDescription = await this.surveyDescription
          .schema(token.schema_name)
          .findOne({
            where: {
              id: token.survey_id,
            },
          });

        let surveyDescriptionBody = {
          assessments_completed: literal(
            `assessments_completed + ${completedCount}`
          ),
          assessments_due: literal(`assessments_due - ${completedCount}`),
        };

        if (
          surveyDescription.assessments_completed !==
            surveyDescription.total_assessments &&
          surveyDescription.assessments_completed + completedCount ===
            surveyDescription.total_assessments
        ) {
          surveyDescriptionBody["status"] = SurveyDescriptionStatus.Completed;
          surveyDescriptionBody["previous_status"] = literal("status");
          await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).update(
            { type: TenantHistoryTypes.completed_survey },
            {
              where: { reference_id: surveyDescription.id },
            }
          );
          await surveyDescription.update(surveyDescriptionBody);
          await this.setBenchmark(
            surveyDescription.questionnaire_id,
            token.schema_name
          );
          await this.reportService.genrateReport(surveyDescription.id, token);
          return "Reports created successfully";
        }
        await surveyDescription.update(surveyDescriptionBody);
      }
    } catch (error) {
      console.log("error in after survey process", error);
    }
  }

  async afterSurveySubmitionProcessForSingleRatee(
    body: SubmitSingleSurveyDTO,
    surveyRespondant: SurveyRespondant | SurveyExternalRespondant,
    survey: Survey,
    token: any,
    tenant: Tenant
  ) {
    if (body.status === SurveyStatus.Completed) {
      await surveyRespondant.update({
        status: SurveyRespondantStatus.Completed,
        response_date: moment().format(),
      });

      await this.tenantMetaData
        .schema(DB_PUBLIC_SCHEMA)
        .increment("surveys_completed_count", {
          where: {
            tenant_id: [tenant.id, tenant.parent_tenant_id],
          },
        });
      await this.tenantMetaData
        .schema(DB_PUBLIC_SCHEMA)
        .decrement("surveys_ongoing_count", {
          where: {
            tenant_id: [tenant.id, tenant.parent_tenant_id],
          },
        });

      if (survey.completed_surveys + 1 === survey.no_of_respondents) {
        await survey.update({
          completed_surveys: survey.completed_surveys + 1,
          status: SurveyStatus.Completed,
        });

        const surveyDescription = await this.surveyDescription
          .schema(token.schema_name)
          .findOne({
            where: {
              id: survey.survey_id,
            },
          });

        let surveyDescriptionBody = {
          assessments_completed: literal("assessments_completed + 1"),
          assessments_due: literal("assessments_due - 1"),
        };

        if (
          surveyDescription.assessments_completed + 1 ===
          surveyDescription.total_assessments
        ) {
          surveyDescriptionBody["status"] = SurveyDescriptionStatus.Completed;
          await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).update(
            { type: TenantHistoryTypes.completed_survey },
            {
              where: { reference_id: surveyDescription.id },
            }
          );
          await surveyDescription.update(surveyDescriptionBody);
          await this.setBenchmark(
            surveyDescription.questionnaire_id,
            token.schema_name
          );
          await this.reportService.genrateReport(surveyDescription.id, token);
          return "Reports created successfully";
        }
        await surveyDescription.update(surveyDescriptionBody);
      } else {
        await survey.update({
          completed_surveys: survey.completed_surveys + 1,
        });
      }
    } else {
      await surveyRespondant.update({
        status: SurveyRespondantStatus.Ongoing,
      });
    }
  }
}
