import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { col, fn, literal, Op } from "sequelize";
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
import { AddRespondents, CreateSurveyDTO, UpdateSurveyDTO } from "../dtos";
import {
  AlternativeExternalRespondentDTO,
  AlternativeRespondentDTO,
  SendSuggestionDTO,
} from "../dtos/alternativeRespondent.dto";
import { ApproveRespondentDTO } from "../dtos/approveRespondent.dto";
import { SubmitSurveyDTO } from "../dtos/submitSurvey.dto";
import {
  // CompetencyComment,
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
    // @InjectModel(CompetencyComment)
    // private readonly competencyComment: typeof CompetencyComment,
    @InjectModel(Rater)
    private readonly rater: typeof Rater,
    private readonly jwtService: JwtService,
    private readonly requestParams: RequestParamsService,
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(TenantHistory)
    private readonly tenantHistory: typeof TenantHistory,
    private readonly mailsService: MailsService,
    private readonly config: ConfigService,
    private readonly reportService: ReportsService
  ) {}

  async createSurvey(body: CreateSurveyDTO, raterIds?: string[]) {
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
      .create({
        title: questionnaireFromDB.title,
        description: questionnaireFromDB.description,
        no_of_questions: questionnaireFromDB.no_of_questions,
        is_copy: true,
      });

    let questionnaireCompetencies = [];
    let questionnaireQuestions = [];
    let questionResponses = [];
    let questionAreaAssessment = [];

    for (const competency of questionnaireFromDB.competencies) {
      const competencyCreated = await this.competency
        .schema(this.requestParams.schema_name)
        .create({
          title: competency.title,
          description: competency.description,
          is_copy: true,
          no_of_questions: competency.no_of_questions,
          type: competency.type,
        });

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
          .create({
            text: question.text,
            response_type: question.response_type,
            competency_id: competencyCreated.id,
            is_copy: true,
            max_score: question.max_score,
          });

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
          });
        }
      }
    }

    await this.questionnaireCompetency
      .schema(this.requestParams.schema_name)
      .bulkCreate(questionnaireCompetencies);
    await this.questionnaireQuestion
      .schema(this.requestParams.schema_name)
      .bulkCreate(questionnaireQuestions);
    await this.questionResponse
      .schema(this.requestParams.schema_name)
      .bulkCreate(questionResponses);
    await this.questionAreaAssessment
      .schema(this.requestParams.schema_name)
      .bulkCreate(questionAreaAssessment);

    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .create({
        end_date: body.end_date,
        title: body.title,
        description: body.description,
        assessments_due: body.employees.length,
        total_assessments: body.employees.length,
        questionnaire_id: questionnaire.id,
      });

    const raters = await this.rater
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          survey_description_id: null,
          id: raterIds,
        },
      });

    await this.rater.schema(this.requestParams.schema_name).bulkCreate(
      raters.map((rater) => ({
        name: rater.name,
        category_name: rater.category_name,
        short_name: rater.short_name,
        can_be_deleted: rater.can_be_deleted,
        is_external: rater.is_external,
        // is_required: rater.is_required,
        no_of_raters: rater.no_of_raters,
        survey_description_id: surveyDescription.id,
      }))
    );

    const survey = body.employees.map((item) => ({
      survey_id: surveyDescription.id,
      employee_id: item,
    }));

    await this.survey.schema(this.requestParams.schema_name).bulkCreate(survey);
    if (!raterIds) {
      this.afterSurveyProcess(body, surveyDescription);
    }
    // employee passwords are created after they have been added in a survey by default all employees can't login
    return surveyDescription;
  }

  async addResponedents(
    body: AddRespondents,
    sendMail?: boolean,
    rateeId?: string
  ) {
    const survey = await this.survey
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id: body.survey_id },
        include: [
          {
            model: SurveyDescription,
            attributes: ["title", "id"],
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
            attributes: ["name", "email"],
          },
        ],
      });

    if (!survey) throw new NotFoundException("Survey not found");

    let surveyRespondants = body.surveyRespondents.map((item) => ({
      survey_id: body.survey_id,
      respondant_id: item.respondant_id,
      relationship_with_employee_id: item.relationship_with_employee_id,
      is_selected_by_system: item.is_selected_by_system || false,
      is_approved_by_employee: item.is_approved_by_employee || true,
      is_approved_by_line_manager: item.is_approved_by_line_manager || false,
    }));

    const externalSurveyRespondants = body.externalSurveyRespondents.map(
      (item) => ({
        survey_id: body.survey_id,
        respondant_email: item.respondant_email,
        respondant_name: item.respondant_name,
        relationship_with_employee_id: item.relationship_with_employee_id,
        is_approved_by_employee: item.is_approved_by_employee || true,
        is_approved_by_line_manager: item.is_approved_by_line_manager || false,
      })
    );

    const selfRater = await Rater.schema(
      this.requestParams.schema_name
    ).findOne({
      where: {
        name: "Self",
        survey_description_id: null,
      },
      attributes: ["id"],
    });

    surveyRespondants.push({
      survey_id: body.survey_id,
      respondant_id: sendMail ? rateeId : this.requestParams.user.id,
      relationship_with_employee_id: selfRater.id,
      is_selected_by_system: true,
      is_approved_by_employee: true,
      is_approved_by_line_manager: true,
    });

    if (sendMail) {
      surveyRespondants = surveyRespondants.filter(
        (e) => e.respondant_id != undefined
      );
    }

    await this.surveyRespondant.schema(this.requestParams.schema_name).destroy({
      where: { survey_id: body.survey_id },
    });
    await this.surveyExternalRespondant
      .schema(this.requestParams.schema_name)
      .destroy({
        where: { survey_id: body.survey_id },
      });
    await this.surveyRespondant
      .schema(this.requestParams.schema_name)
      .bulkCreate(surveyRespondants);
    await this.surveyExternalRespondant
      .schema(this.requestParams.schema_name)
      .bulkCreate(externalSurveyRespondants);

    if (!sendMail) {
      if (!this.requestParams.tenant.is_lm_approval_required) {
        await survey.update({
          status: SurveyStatus.Ongoing,
          no_of_respondents:
            surveyRespondants.length + externalSurveyRespondants.length,
        });
        await this.launchSurvey(survey, body.survey_id);
      } else {
        await this.survey.schema(this.requestParams.schema_name).update(
          {
            status: SurveyStatus.In_Progress,
            no_of_respondents:
              surveyRespondants.length + externalSurveyRespondants.length,
          },
          { where: { id: body.survey_id } }
        );
        await this.surveyDescription
          .schema(this.requestParams.schema_name)
          .update(
            {
              status: SurveyDescriptionStatus.In_Progress,
            },
            {
              where: {
                id: survey.survey_id,
              },
            }
          );
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

          subject: `Respondent Nomination Approval Request | ${survey.survey_description.title}`,
          context: {
            link: `${this.config.get("FE_URL")}/survey/approval-requests/${
              survey.survey_description.id
            }/${survey.id}`,
            username: survey.employee.line_manager.name,
            email: survey.employee.line_manager.email,
            password,
            is_new_user: Boolean(password),
            requester: `${survey.employee.name} (${survey.employee.designation.name})`,
            survey_name: survey.survey_description.title,
            logo: "cid:company-logo",
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

        this.mailsService.RespondentApprovalRequestMail(Mail);
      }
    }
    return "Respondents added successfully";
  }

  async approveRespondent(id: string, body: ApproveRespondentDTO) {
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
          { where: { id } }
        );
    } else {
      await this.surveyRespondant.schema(this.requestParams.schema_name).update(
        {
          respondant_id: body.alternative
            ? body.alternative
            : respondent.respondant_id,
          is_approved_by_employee: true,
          is_approved_by_line_manager: true,
        },
        { where: { id } }
      );
    }

    return "Respondent approved successfully";
  }

  async alternativeRespondent(body: AlternativeRespondentDTO, id: string) {
    let respondent = await this.surveyRespondant
      .schema(this.requestParams.schema_name)
      .findOne({ where: { id } });

    if (!respondent) throw new NotFoundException("Respondent Not Found");

    const log = await this.surveySuggestionsLogs
      .schema(this.requestParams.schema_name)
      .create({
        suggested_by: body.suggested_by,
        // comments: body.comments,
        alternative_suggestion_id: body.alternative_suggestion_id,
        survey_respondant_id: id,
      });

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
      { where: { id } }
    );

    return "Alternative Respondent added successfully";
  }

  async alternativeExternalRespondent(
    body: AlternativeExternalRespondentDTO,
    id: string
  ) {
    let respondent = await this.surveyExternalRespondant
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id },
      });

    if (!respondent) throw new NotFoundException("Respondent Not Found");

    const log = await this.surveySuggestionsLogs
      .schema(this.requestParams.schema_name)
      .create({
        suggested_by: body.suggested_by,
        // comments: body.comments,
        alternative_email: body.alternative_email,
        alternative_name: body.alternative_name,
        external_survey_respondant_id: respondent.id,
      });

    await respondent.update({
      last_suggestion_id: log.id,
      is_approved_by_line_manager:
        body.suggested_by === SuggestedByOptions.LINE_MANAGER
          ? false
          : respondent.is_approved_by_line_manager,
      is_approved_by_employee:
        body.suggested_by === SuggestedByOptions.EMPLOYEE
          ? false
          : respondent.is_approved_by_employee,
    });

    return "Alternative Respondent added successfully";
  }

  async sendSuggestion(body: SendSuggestionDTO, id: string) {
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
      await this.launchSurvey(survey, id);
      return "Survey Launche successfully";
    } else {
      if (survey.employee_id === this.requestParams.user.id) {
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
            ...defaultAttachments,
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
            username: survey.employee.name,
            is_new_user: false,
            logo: "cid:company-logo",
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
  }

  async submitSurvey(body: any) {
    const token: any = await this.jwtService.decode(body.token);

    let surveyRespondant;

    // await this.sequelize.query(`set search_path to ${token.schema_name}`);

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
          survey_respondant_id: token.is_external ? null : surveyRespondant.id,
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

    // const competencyComments: any = Object.entries(body.competencyComments).map(
    //   ([key, value]) => ({
    //     competency_id: key,
    //     comments: value,
    //     survey_id: survey.id,
    //     survey_respondent_id: token.is_external
    //       ? undefined
    //       : surveyRespondant.id,
    //     survey_external_respondent_id: token.is_external
    //       ? surveyRespondant.id
    //       : undefined,
    //   })
    // );

    await this.surveyResponse
      .schema(token.schema_name)
      .destroy({ where: destroyWhere });
    await this.surveyResponse.schema(token.schema_name).bulkCreate(data);
    // await this.competencyComment.schema(token.schema_name).destroy({
    //   where: {
    //     [Op.or]: [
    //       { survey_respondent_id: surveyRespondant.id },
    //       { survey_external_respondent_id: surveyRespondant.id },
    //     ],
    //   },
    // });
    // await this.competencyComment
    //   .schema(token.schema_name)
    //   .bulkCreate([...competencyComments]);

    this.afterSurveySubmitionProcess(body, surveyRespondant, survey, token);

    return "Survey submited successfully";
  }

  async updateSurvey(id: string, body: UpdateSurveyDTO) {
    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id },
      });
    const body_end_date = new Date(body?.end_date);
    let current_date = new Date();

    const survey = await this.survey
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { survey_id: id },
      });

    if (!surveyDescription || !survey)
      throw new NotFoundException("Survey not found");

    await surveyDescription.update(body);
    if (
      surveyDescription?.status === SurveyDescriptionStatus.OnHold &&
      body_end_date > current_date
    ) {
      await surveyDescription.update({
        status: surveyDescription.previous_status,
      });

      await survey.update(
        {
          status: SurveyStatus.Ongoing,
          previous_status: survey.status,
        },
        { where: { survey_id: surveyDescription.id } }
      );
    }
    if (body.status) {
      await survey.update({ status: body.status });
    }
  }

  async terminateSurvey(id: string) {
    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id },
      });

    await surveyDescription.update({
      status: SurveyDescriptionStatus.Terminated,
      previous_status: surveyDescription.status,
    });

    await this.survey
      .schema(this.requestParams.schema_name)
      .update(
        { status: SurveyStatus.Terminated, previous_status: literal("status") },
        { where: { survey_id: id } }
      );
  }

  async launchSurvey(survey: any, id: string) {
    try {
      this.surveyDescription.schema(this.requestParams.schema_name).update(
        {
          status: SurveyDescriptionStatus.Ongoing,
        },
        {
          where: {
            id: survey.survey_id,
          },
        }
      );

      const respondents = await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .findAll({
          where: { survey_id: id },
          attributes: ["id"],
          include: [
            {
              model: User,
              attributes: ["name", "email"],
            },
            {
              model: Rater,
              attributes: ["short_name"],
            },
          ],
        });
      const externalRespondents = await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .findAll({
          where: { survey_id: id },
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
        if (respondents[index]) {
          this.sendToRepondent(respondents[index], survey, tokens);
        }
        if (externalRespondents[index]) {
          this.sendToExternalRespondent(
            externalRespondents[index],
            survey,
            tokens
          );
        }
      }

      this.mailsService.sendTokens(tokens);
      await this.surveyRespondant.update(
        {
          status: SurveyRespondantStatus.Ongoing,
          is_approved_by_employee: true,
          is_approved_by_line_manager: true,
        },
        {
          where: { survey_id: id },
        }
      );
      await this.surveyExternalRespondant.update(
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
      console.log(error);
    }
  }

  async sendToRepondent(
    resp: SurveyRespondant,
    survey: Survey,
    tokens?: string[]
  ) {
    const token = await this.jwtService.signAsync({
      id: resp.id,
      schema_name: this.requestParams.tenant.schema_name,
      is_external: false,
    });
    if (tokens) {
      tokens.push(token);
    }

    if (survey.employee.id === resp.respondant.id) {
      let Mail = {
        to: resp.respondant.email,
        subject: `Request to complete Self Feedabck | ${survey.survey_description.title}`,
        context: {
          link: `${this.config.get("FE_URL")}/survey/assessment/${token}`,
          username: resp.respondant.name,
          logo: "cid:company-logo",
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

      this.mailsService.SelfSurveyMail(Mail);
    } else {
      let Mail = {
        to: resp.respondant.email,
        subject: `Request to fill feedback survey | ${survey.survey_description.title}`,
        context: {
          link: `${this.config.get("FE_URL")}/survey/assessment/${token}`,
          username: resp.respondant.name,
          logo: "cid:company-logo",
          requester: `${survey.employee.name} ${
            survey.employee.designation &&
            `(${survey.employee.designation.name})`
          } `,
          relation: resp.rater.category_name,
          survey_name: survey.survey_description.title,
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

      this.mailsService.SurveyMail(Mail);
    }
  }

  async sendToExternalRespondent(
    resp: SurveyExternalRespondant,
    survey: Survey,
    tokens?: string[]
  ) {
    const token = await this.jwtService.signAsync({
      id: resp.id,
      schema_name: this.requestParams.tenant.schema_name,
      is_external: true,
    });

    if (tokens) {
      tokens.push(token);
    }

    let Mail = {
      to: resp.respondant_email,
      subject: `Request to fill feedback survey | ${survey.survey_description.title}`,
      context: {
        link: `${this.config.get("FE_URL")}/survey/assessment/${token}`,
        username: resp.respondant_name,
        logo: "cid:company-logo",
        requester: `${survey.employee.name} ${
          survey.employee.designation && `(${survey.employee.designation.name})`
        }`,
        relation: resp.rater.category_name,
        survey_name: survey.survey_description.title,
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

    this.mailsService.SurveyMail(Mail);
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
          is_tenant: false,
          system_link: `${this.config.get("FE_URL")}/sign-in`,
          be_link: this.config.get("BE_URL"),
          logo: "cid:company-logo",
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
          is_tenant: false,
          system_link: `${this.config.get("FE_URL")}/sign-in`,
          be_link: this.config.get("BE_URL"),
          logo: "cid:company-logo",
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

      this.mailsService.TenantRegisterMail(Mail);
    }

    await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).create({
      type: TenantHistoryTypes.ongoing_survey,
      reference_id: surveyDescription.id,
      tenant_id: this.requestParams.tenant.id,
      group: TenantHistoryGroup.survey,
    });
  }

  async afterSurveySubmitionProcess(
    body: SubmitSurveyDTO,
    surveyRespondant: SurveyRespondant | SurveyExternalRespondant,
    survey: Survey,
    token: any
  ) {
    if (body.status === SurveyStatus.Completed) {
      await surveyRespondant.update({
        status: SurveyRespondantStatus.Completed,
        response_date: moment().format(),
      });

      const countOfCompletedSurveyRespondents = await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .count({
          where: {
            survey_id: survey.id,
            status: SurveyRespondantStatus.Completed,
          },
        });

      const countOfCompletedSurveyExternalRespondents =
        await this.surveyExternalRespondant
          .schema(this.requestParams.schema_name)
          .count({
            where: {
              survey_id: survey.id,
              status: SurveyRespondantStatus.Completed,
            },
          });

      if (
        countOfCompletedSurveyExternalRespondents +
          countOfCompletedSurveyRespondents ===
        survey.no_of_respondents
      ) {
        await survey.update({
          status: SurveyStatus.Completed,
        });

        const countOfCompletedSurveys = await this.survey
          .schema(this.requestParams.schema_name)
          .count({
            where: {
              survey_id: survey.survey_id,
              status: SurveyStatus.Completed,
            },
          });

        const surveyDescription = await this.surveyDescription
          .schema(this.requestParams.schema_name)
          .findOne({
            where: {
              id: survey.survey_id,
            },
          });

        let surveyDescriptionBody = {
          assessments_completed: literal("assessments_completed + 1"),
          assessments_due: literal("assessments_due - 1"),
        };

        if (countOfCompletedSurveys === surveyDescription.total_assessments) {
          surveyDescriptionBody["status"] = SurveyDescriptionStatus.Completed;
          await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).update(
            { type: TenantHistoryTypes.completed_survey },
            {
              where: { reference_id: surveyDescription.id },
            }
          );
          await surveyDescription.update(surveyDescriptionBody);
          await this.setBenchmark(surveyDescription.questionnaire_id);
          await this.reportService.genrateReport(surveyDescription, token);
          return "Reports created successfully";
        }
        await surveyDescription.update(surveyDescriptionBody);
      }
    } else {
      await surveyRespondant.update({
        status: SurveyRespondantStatus.Ongoing,
      });
    }
  }

  async setBenchmark(questionnaire_id: string, token?: any) {
    if (token) {
      // await this.sequelize.query(`set search_path to ${token.schema_name};`);
    }
    const questions = await this.question
      .schema(token?.schema_name || this.requestParams.schema_name)
      .findAll({
        where: {
          // max_score: 5,
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
            // required: false,
            required: true,
            where: {
              is_dont_know: false,
            },
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

    for (const [key, value] of Object.entries({ ...benchmark }) as any) {
      await this.competency
        .schema(token.schema_name || this.requestParams.schema_name)
        .update(
          { benchmark: +(value.score / value.count).toFixed(2) },
          { where: { id: key, is_copy: true } }
        );
    }

    return "Done";
  }
}
