import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import * as moment from "moment";
import { literal, Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { getSearchObject } from "src/common/helpers";
import { RequestParamsService } from "src/common/modules";
import { MailsService } from "src/common/modules/mails";
import {
  defaultAttachments,
  defaultContext,
} from "src/common/modules/mails/constants";
import { Competency } from "src/modules/competencies/models";
import {
  Question,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { QuestionResponseOptions } from "src/modules/competencies/modules/questions/types";
import {
  QuestionnaireCompetency,
  QuestionnaireQuestion,
} from "src/modules/questionnaires/models";
import { Department } from "src/modules/settings/modules/department/models";
import { Designation } from "src/modules/settings/modules/designation/models";
import { Rater } from "src/modules/settings/modules/rater/models";
import { User } from "src/modules/users/models";
import {
  // CompetencyComment,
  Survey,
  SurveyDescription,
  SurveyExternalRespondant,
  SurveyRespondant,
  SurveyResponse,
  SurveySuggestionsLogs,
} from "../models";
import { SurveyRespondantStatus, SurveyStatus } from "../type";
import { log } from "util";
import { constants } from "buffer";
import { CommentResponse } from "../models/commentResponse.model";
const ExcelJS = require("exceljs");
@Injectable()
export class GetSurveyService {
  constructor(
    @InjectModel(SurveyDescription)
    private readonly surveyDescription: typeof SurveyDescription,
    @InjectModel(Survey)
    private readonly survey: typeof Survey,
    @InjectModel(SurveyExternalRespondant)
    private readonly surveyExternalRespondant: typeof SurveyExternalRespondant,
    @InjectModel(User)
    private readonly user: typeof User,
    private readonly requestParams: RequestParamsService,
    @InjectModel(Rater)
    private readonly rater: typeof Rater,
    @InjectModel(SurveySuggestionsLogs)
    private readonly surveySuggestionsLogs: typeof SurveySuggestionsLogs,
    @InjectModel(SurveyRespondant)
    private readonly surveyRespondant: typeof SurveyRespondant,
    private readonly jwtService: JwtService,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly mailsService: MailsService,
    private readonly config: ConfigService,
    @InjectModel(SurveyResponse)
    private readonly surveyResponses: typeof SurveyResponse,
    @InjectModel(Question)
    private readonly question: typeof Question,
    @InjectModel(Competency)
    private readonly competency: typeof Competency,
    @InjectModel(CommentResponse)
    private readonly commentResponse: typeof CommentResponse
  ) {}

  async getAllSurveys() {
    return this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findAndCountAll({
        where: {
          ...getSearchObject(this.requestParams.query, ["title", "status"]),
        },
        include: [
          {
            model: Survey,
            include: [
              {
                model: SurveyRespondant,
              },
              {
                model: SurveyExternalRespondant,
              },
            ],
          },
        ],
        ...this.requestParams.pagination,
      });
  }

  async getMySurveys() {
    return this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findAndCountAll({
        distinct: true,
        where: {
          ...getSearchObject(this.requestParams.query, [
            '"SurveyDescription"."title"',
            '"SurveyDescription"."status"',
          ]),
        },
        ...this.requestParams.pagination,
        include: {
          model: Survey,
          where: {
            employee_id: this.requestParams.user.id,
          },
          attributes: ["id", "status", "no_of_respondents"],
        },
      });
  }

  async getOneSurvey(id: string, surveyDecriptionQuery: string) {
    let surveyDescription = {};

    if (!surveyDecriptionQuery) {
      surveyDescription = await this.surveyDescription
        .schema(this.requestParams.schema_name)
        .findOne({
          where: { id },
          attributes: ["id", "title", "status"],
        });
    }

    const surveys = await this.survey
      .schema(this.requestParams.schema_name)
      .findAndCountAll({
        where: {
          survey_id: id,
        },
        distinct: true,
        ...this.requestParams.pagination,
        include: [
          {
            model: User,
            attributes: ["id", "name", "email", "contact"],
            include: [
              {
                model: Department,
                attributes: ["name"],
              },
              {
                model: Designation,
                attributes: ["name"],
              },
              {
                model: User,
                as: "line_manager",
                attributes: ["name"],
              },
            ],
          },
          {
            model: SurveyRespondant,
            include: [
              {
                model: User,
                attributes: ["name", "email", "id", "contact"],
                include: [
                  {
                    model: Department,
                    attributes: ["name"],
                  },
                  {
                    model: Designation,
                    attributes: ["name"],
                  },
                ],
              },
            ],
          },
          { model: SurveyExternalRespondant },
        ],
      });

    if (surveyDecriptionQuery) {
      return surveys;
    }

    return { ...JSON.parse(JSON.stringify(surveyDescription)), surveys };
  }

  async getOneSurveyForMailSend(id: string) {
    return this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id },
        attributes: ["id", "title", "status"],
        include: [
          {
            model: User,
            attributes: ["id", "name", "email", "contact"],
            through: { attributes: ["status", "id"] },
            include: [
              { model: Department, attributes: ["name"] },
              { model: Designation, attributes: ["name"] },
              { model: User, as: "line_manager", attributes: ["name"] },
            ],
          },
        ],
      });
  }

  // get all users who are going to submit survey for this user
  async getAllRespondentsOfSurveyRecipient(survey_recipient_id: string) {
    const survey = await this.survey
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id: survey_recipient_id },
        attributes: ["id", "status"],
        include: [
          {
            model: User,
            attributes: ["name"],
          },
          {
            model: SurveyDescription,
            attributes: ["title"],
          },
        ],
      });

    const data = await Promise.all([
      this.user
        .unscoped()
        .schema(this.requestParams.schema_name)
        .findAll({
          attributes: ["id", "name", "email", "contact", "employee_code"],
          order: [
            [
              { model: SurveyRespondant, as: "respondant" },
              { model: Rater, as: "rater" },
              "order",
              "asc",
            ],
          ],
          include: [
            {
              model: SurveyRespondant,
              as: "respondant",
              attributes: ["id", "status", "response_date"],
              include: [
                {
                  model: Rater,
                  attributes: ["category_name", "is_external", "order", "id"],
                },
              ],
              required: true,
              where: {
                survey_id: survey_recipient_id,
              },
            },
            {
              model: Designation,
              attributes: ["name"],
            },
          ],
        }),
      this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .findAll({
          include: [
            {
              model: Rater,
              attributes: ["category_name", "is_external", "order", "id"],
            },
          ],
          where: { survey_id: survey_recipient_id },
        }),
    ]);

    return { users: [...data[0], ...data[1]], survey };
  }

  async getMyAllPendingSurvey() {
    return this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findAndCountAll({
        where: {
          '$"surveys"."employee_id"$': this.requestParams.user.id,
          [Op.and]: {
            '$"surveys->survey_respondants"."survey_id"$': null,
            '$"surveys->survey_external_respondants"."survey_id"$': null,
          },
          ...getSearchObject(this.requestParams.query, ["title", "status"]),
        },
        distinct: true,
        ...this.requestParams.pagination,
        subQuery: false,

        include: {
          model: Survey,
          attributes: ["id", "status", "employee_id"],
          include: [
            {
              model: SurveyRespondant,
            },
            {
              model: SurveyExternalRespondant,
            },
          ],
        },
      });
  }

  async getAllRaterCategory(id: string) {
    const user = await this.user
      .schema(this.requestParams.schema_name)
      .findOne({
        include: [
          {
            model: Survey,
            where: { id },
            attributes: ["survey_id"],
          },
          {
            model: Department,
            attributes: ["name"],
          },
          {
            model: Designation,
            attributes: ["name"],
          },
        ],
      });

    const raters = await this.rater
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          name: { [Op.ne]: "Self" },
          survey_description_id: user.surveys[0]
            ? user.surveys[0].survey_id
            : undefined,
        },
        include: [
          {
            model: User,
            through: { attributes: [], where: { survey_id: id } },
            include: [
              {
                model: Department,
                attributes: ["name"],
              },
              {
                model: Designation,
                attributes: ["name"],
              },
              {
                model: SurveyRespondant,
                required: false,
                where: {
                  survey_id: id,
                },
                include: [
                  {
                    model: SurveySuggestionsLogs,
                    as: "last_suggestion",
                    on: literal(
                      '"users->respondant"."last_suggestion_id" = "users->respondant->last_suggestion"."id"'
                    ),
                    include: [
                      {
                        model: User,
                        attributes: ["name", "email", "id"],
                      },
                    ],
                  },
                  {
                    model: SurveySuggestionsLogs,
                    on: literal(
                      '"users->respondant"."id" = "users->respondant->logs"."survey_respondant_id"'
                    ),
                    as: "logs",
                    include: [
                      {
                        model: User,
                        attributes: ["name", "email", "id"],
                      },
                    ],
                  },
                ],
                as: "respondant",
              },
            ],
          },
          {
            model: SurveyExternalRespondant,
            required: false,
            where: { survey_id: id },
            include: [
              {
                model: SurveySuggestionsLogs,
                on: literal(
                  '"surveyExternalRespondant"."last_suggestion_id" = "surveyExternalRespondant->last_suggestion"."id"'
                ),
              },
            ],
          },
        ],
      });

    return { raters, user };
  }

  async getAllPendingApprovalSurvey() {
    return this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findAndCountAll({
        ...this.requestParams.pagination,
        distinct: true,
        where: {
          '$"surveys->employee"."line_manager_id"$': this.requestParams.user.id,
          '$"surveys"."status"$': [
            SurveyStatus.In_Progress,
            SurveyStatus.Suggested_by_EMP,
          ],
          ...getSearchObject(this.requestParams.query, ["title"]),
        },
        subQuery: false,
        include: [
          {
            model: Survey,
            attributes: ["id"],
            include: [
              {
                model: User,
                attributes: [],
              },
              {
                attributes: [],
                model: SurveyRespondant,
              },
              {
                attributes: [],
                model: SurveyExternalRespondant,
              },
            ],
          },
        ],
      });
  }

  async getAllPendingApprovalSurveyUsers(id: string) {
    return this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id },
        attributes: ["id", "title"],
        include: [
          {
            model: User,
            attributes: ["id", "name", "email", "contact"],
            where: { line_manager_id: this.requestParams.user.id },
            through: {
              attributes: ["status", "id"],
              where: {
                status: [
                  SurveyStatus.In_Progress,
                  SurveyStatus.Suggested_by_EMP,
                ],
              },
            },
            include: [
              {
                model: Department,
                attributes: ["name"],
              },
              {
                model: Designation,
                attributes: ["name"],
              },
              {
                model: User,
                as: "line_manager",
                attributes: ["name"],
              },
            ],
          },
        ],
      });
  }

  async getAllAlternativeSuggestions() {
    return this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findAndCountAll({
        distinct: true,
        where: {
          ...getSearchObject(this.requestParams.query, ["title", "status"]),
        },
        ...this.requestParams.pagination,
        subQuery: false,
        include: {
          model: Survey,
          attributes: ["id", "status"],
          where: {
            employee_id: this.requestParams.user.id,
            status: SurveyStatus.Suggested_by_LM,
          },
        },
      });
  }

  async getAllSurveyRespondentComments(id: string) {
    return this.surveySuggestionsLogs
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          [Op.or]: [
            { survey_respondant_id: id },
            { external_survey_respondant_id: id },
          ],
        },
        include: {
          model: User,
          attributes: ["name", "email", "id"],
        },
      });
  }

  async getFullDetailOfSurvey(token: any) {
    let respondentInclude = [];
    let respondentIncludeComments = [];
    let respondents;
    let responseWhere = {};

    if (!token.is_external) {
      respondents = await SurveyRespondant.schema(
        this.requestParams.schema_name
      ).findAll({
        where: {
          respondant_id: token.id,
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: Survey,
            where: { survey_id: token.survey_id },
          },
        ],
      });
      responseWhere = {
        survey_respondant_id: respondents.map((item) => item.id),
      };
      respondentIncludeComments.push({
        model: SurveyRespondant,
        where: {
          // id: token.survey_respondant_id,
          respondant_id: token.id,
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: Rater,
            attributes: ["id", ["category_name", "name"], "order"],
          },
        ],
      });
      respondentInclude.push({
        model: SurveyRespondant,
        where: {
          // id: token.survey_respondant_id,
          respondant_id: token.id,
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: User,
            attributes: ["email", "id", "name"],
            as: "respondant",
          },

          {
            model: Rater,
            attributes: ["id", ["category_name", "name"], "order"],
          },
        ],
      });
    } else {
      respondents = await SurveyExternalRespondant.schema(
        this.requestParams.schema_name
      ).findAll({
        where: {
          respondant_email: token.email,
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: Survey,
            where: { survey_id: token.survey_id },
          },
        ],
      });
      responseWhere = {
        survey_external_respondant_id: respondents.map((item) => item.id),
      };
      respondentIncludeComments.push({
        model: SurveyExternalRespondant,
        where: {
          respondant_email: token.email,
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: Rater,
            attributes: ["id", ["category_name", "name"], "order"],
          },
        ],
      });
      respondentInclude.push({
        model: SurveyExternalRespondant,
        where: {
          respondant_email: token.email,
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: Rater,
            attributes: ["id", ["category_name", "name"], "order"],
          },
        ],
      });
    }

    if (!respondents.length) {
      return { user: null, survey: null };
    }

    if (respondents.every((item) => item.status === SurveyStatus.Completed)) {
      return { user: null, survey: null };
    }

    const surveyDescription = await this.surveyDescription
      .unscoped()
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          id: token.survey_id,
        },
        order: [
          token.is_external
            ? [
                { model: Survey, as: "surveys" },
                {
                  model: SurveyExternalRespondant,
                  as: "survey_external_respondants",
                },
                { model: Rater, as: "rater" },
                "order",
                "ASC",
              ]
            : [
                { model: Survey, as: "surveys" },
                { model: SurveyRespondant, as: "survey_respondants" },
                { model: Rater, as: "rater" },
                "order",
                "ASC",
              ],
        ],
        include: [
          {
            model: Survey,
            include: [
              {
                model: User,
                attributes: ["email", "id", "name"],
              },
              { model: CommentResponse },

              ...respondentInclude,
            ],
          },
        ],
      });

    const questions = await this.question
      .schema(this.requestParams.schema_name)
      .unscoped()
      .findAll({
        subQuery: false,
        order: [
          [
            {
              model: Competency,
              as: "competency",
            },
            {
              model: QuestionnaireCompetency,
              as: "questionnaireCompetencies",
            },
            "order",
            "ASC",
          ],
          [
            {
              model: QuestionnaireQuestion,
              as: "questionnaireQuestion",
            },
            "order",
            "ASC",
          ],
          [
            {
              model: QuestionResponse,
              as: "responses",
            },
            "order",
            "ASC",
          ],
          // ["order", "ASC"],
        ],
        include: [
          {
            model: Competency.unscoped(),
            attributes: ["id", "title"],
            include: [
              {
                model: QuestionnaireCompetency.unscoped(),
              },
            ],
          },
          {
            model: QuestionResponse.unscoped(),
            attributes: [
              "order",
              "score",
              ["id", "value"],
              "type",
              [
                literal(
                  `concat("responses"."label", (case when "responses"."type" = 'likert_scale' then concat(' (', "responses"."score", ')') else '' end))`
                ),
                "label",
              ],
            ],
          },
          {
            model: QuestionnaireQuestion.unscoped(),
            where: {
              questionnaire_id: surveyDescription.questionnaire_id,
            },
            attributes: ["order"],
          },
          {
            model: SurveyResponse,
            required: false,
            as: "surveyResponses",
            where: responseWhere,
          },
        ],
      });

    // const competencyComments = await this.competency
    //   .unscoped()
    //   .schema(this.requestParams.schema_name)
    //   .findAll({
    //     include: [
    //       {
    //         model: QuestionnaireCompetency.unscoped(),
    //         where: {
    //           questionnaire_id: surveyDescription.questionnaire_id,
    //         },
    //         attributes: [],
    //       },
    //       {
    //         model: CompetencyComment,
    //         required: false,
    //         include: [...respondentIncludeComments],
    //       },
    //     ],
    //   });

    const commentResponses = await this.commentResponse
      .unscoped()
      .schema(this.requestParams.schema_name)
      .findAll({
        include: [
          ...respondentIncludeComments,
          {
            model: Survey,
            required: true,
            include: {
              model: SurveyDescription,
              where: {
                id: token.survey_id,
              },
            },
          },
        ],
      });

    // return { questions: questions, surveyDescription, competencyComments };
    return { questions: questions, surveyDescription, commentResponses };
  }

  async getSurveyToken(body: any) {
    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id: body.survey_descriptions_id },
      });

    const respondants = await this.user
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          id: body.survey_respondent_ids,
        },
        attributes: ["name", "email", "id"],
      });
    const externalRespondants = await this.surveyExternalRespondant
      .schema(this.requestParams.schema_name)
      .unscoped()
      .findAll({
        where: {
          id: body.survey_respondent_ids,
        },
        include: [
          {
            attributes: [],
            model: Survey,
          },
        ],
      });

    const maxLength = Math.max(respondants.length, externalRespondants.length);
    let alreadySent = [];
    let alreadySentExternal = [];
    let tokens = [];
    for (let index = 0; index < maxLength; index++) {
      if (
        respondants[index] &&
        !alreadySent.includes(respondants[index].email)
      ) {
        const token = await this.jwtService.signAsync({
          id: respondants[index].id,
          survey_respondant_id: respondants[index].id,
          survey_id: surveyDescription.id,
          schema_name: this.requestParams.tenant.schema_name,
          is_external: false,
        });
        if (tokens) {
          tokens.push(token);
        }

        let Mail = {
          to: respondants[index].email,
          subject: `Reminder to fill Feedback Survey | ${surveyDescription.title}`,
          context: {
            link: `${this.config.get(
              "FE_URL"
            )}/survey/assessment/instructions/${token}`,
            username: respondants[index].name,
            logo: "cid:company-logo",
            surveyTitle: surveyDescription.title,
            tenantName: this.requestParams.tenant.name,
            endDate: moment(surveyDescription.end_date).format("DD/MM/YY"),
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

        this.mailsService.SurveyMail(Mail);
        alreadySent.push(respondants[index].email);
      }
      if (
        externalRespondants[index] &&
        !alreadySentExternal.includes(
          externalRespondants[index].respondant_email
        )
      ) {
        const token = await this.jwtService.signAsync({
          email: externalRespondants[index].respondant_email,
          schema_name: this.requestParams.tenant.schema_name,
          survey_id: surveyDescription.id,
          is_external: true,
        });

        if (tokens) {
          tokens.push(token);
        }

        let Mail = {
          to: externalRespondants[index].respondant_email,
          subject: `Reminder to fill Feedback Survey | ${surveyDescription.title}`,
          context: {
            link: `${this.config.get(
              "FE_URL"
            )}/survey/assessment/instructions/${token}`,
            username: externalRespondants[index].respondant_name,
            logo: "cid:company-logo",
            surveyTitle: surveyDescription.title,
            tenantName: this.requestParams.tenant.name,
            endDate: moment(surveyDescription.end_date).format("DD/MM/YY"),
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

        this.mailsService.SurveyMail(Mail);
        alreadySentExternal.push(externalRespondants[index].respondant_email);
      }
    }

    return tokens;
  }

  async getRespondentsGroupByRaters(survey_id: string, id: string) {
    return this.rater.schema(this.requestParams.schema_name).findAll({
      where: {
        survey_description_id: survey_id,
        name: {
          [Op.ne]: "Self",
        },
      },
      include: [
        {
          model: SurveyRespondant,
          include: [
            { model: Survey, where: { id } },
            {
              model: User,
              attributes: ["name", "email", "id", "contact", "employee_code"],
              include: [
                {
                  model: Department,
                  attributes: ["name"],
                },
                {
                  model: Designation,
                  attributes: ["name"],
                },
              ],
            },
          ],
        },
        {
          model: SurveyExternalRespondant,
          include: [{ model: Survey, where: { id } }],
        },
      ],
    });
  }

  //////OLD SEND MAIL
  async getSurveyToken2(id: string) {
    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id },
      });
    const respondants = await this.surveyRespondant
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            attributes: [],
            model: Survey,
            where: {
              survey_id: id,
            },
          },
          {
            model: User,
            attributes: ["name", "email", "id"],
          },
        ],
      });
    const externalRespondants = await this.surveyExternalRespondant
      .schema(this.requestParams.schema_name)
      .unscoped()
      .findAll({
        where: {
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            attributes: [],
            model: Survey,
            where: {
              survey_id: id,
            },
          },
        ],
      });
    const maxLength = Math.max(respondants.length, externalRespondants.length);
    let alreadySent = [];
    let alreadySentExternal = [];
    let tokens = [];
    for (let index = 0; index < maxLength; index++) {
      if (
        respondants[index] &&
        !alreadySent.includes(respondants[index].respondant.email)
      ) {
        const token = await this.jwtService.signAsync({
          id: respondants[index].respondant.id,
          survey_id: surveyDescription.id,
          schema_name: this.requestParams.tenant.schema_name,
          is_external: false,
        });
        if (tokens) {
          tokens.push(token);
        }

        alreadySent.push(respondants[index].respondant.email);
      }
      if (
        externalRespondants[index] &&
        !alreadySentExternal.includes(
          externalRespondants[index].respondant_email
        )
      ) {
        const token = await this.jwtService.signAsync({
          email: externalRespondants[index].respondant_email,
          schema_name: this.requestParams.tenant.schema_name,
          survey_id: surveyDescription.id,
          is_external: true,
        });

        if (tokens) {
          tokens.push(token);
        }

        alreadySentExternal.push(externalRespondants[index].respondant_email);
      }
    }

    return tokens;
  }
  //////
  async sendToRepondent(
    survey: Survey,
    resp: SurveyRespondant,
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
          link: `${this.config.get(
            "FE_URL"
          )}/survey/assessment/dual-gap/${token}`,
          username: resp.respondant.name,
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

      this.mailsService.SelfSurveyMail(Mail);
    } else {
      let Mail = {
        to: resp.respondant.email,
        subject: `Request to fill feedback survey | ${survey.survey_description.title}`,
        context: {
          link: `${this.config.get(
            "FE_URL"
          )}/survey/assessment/dual-gap/${token}`,
          username: resp.respondant.name,
          logo: "cid:company-logo",
          requester: `${survey.employee.name} ${
            survey.employee.designation
              ? `(${survey.employee.designation.name})`
              : ""
          } `,
          relation: resp.rater.category_name,
          survey_name: survey.survey_description.title,
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

      this.mailsService.SurveyMail(Mail);
    }
    return token;
  }

  async sendToExternalRespondent(
    resp: SurveyExternalRespondant,
    survey: Survey,
    tokens: string[]
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
        link: `${this.config.get(
          "FE_URL"
        )}/survey/assessment/dual-gap/${token}`,
        username: resp.respondant_name,
        logo: "cid:company-logo",
        requester: `${survey.employee.name} ${
          survey.employee.designation
            ? `(${survey.employee.designation.name})`
            : ""
        }`,
        relation: resp.rater.category_name,
        survey_name: survey.survey_description.title,
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

    this.mailsService.SurveyMail(Mail);
    return token;
  }

  async getResponsesExcel(id: string) {
    const surveys = await this.survey
      .schema(this.requestParams.schema_name)
      .findAll({
        where: { survey_id: id },
        include: [
          {
            model: User,
            attributes: ["name", "email"],
          },
          { model: SurveyDescription },
        ],
      });

    const workbook = new ExcelJS.Workbook();
    for (const survey of surveys) {
      const data = await this.surveyResponses
        .schema(this.requestParams.schema_name)
        .findAll({
          include: [
            {
              model: Rater,
              attributes: ["category_name"],
            },
            {
              model: SurveyRespondant,
              attributes: ["id"],
              include: [
                {
                  model: User,
                  attributes: ["name"],
                },
              ],
            },
            {
              model: SurveyExternalRespondant,
              attributes: ["respondant_name"],
            },
            {
              model: Survey,
              where: { id: survey.id },
            },
            {
              model: QuestionResponse,
              as: "response",
              where: {
                is_copy: true,
                type: { [Op.ne]: QuestionResponseOptions.text },
              },
            },
            {
              model: QuestionResponse,
              as: "expected_response",
              where: {
                is_copy: true,
                type: { [Op.ne]: QuestionResponseOptions.text },
              },
            },
            {
              model: Question,
              where: { is_copy: true },
              include: [
                {
                  model: Competency,
                  attributes: ["title"],
                  where: { is_copy: true },
                },
              ],
            },
          ],
        });

      const sheet = workbook.addWorksheet(survey.employee.email, {
        views: [{ state: "frozen", ySplit: 1 }],
      });

      sheet.columns = [
        { header: "Question", key: "question", width: 100 },
        { header: "Type", key: "type", width: 30 },
        { header: "Competency", key: "competency", width: 50 },
        { header: "Respondent", key: "respondent", width: 30 },
        { header: "Response", key: "response", width: 30 },
        { header: "Rater", key: "rater", width: 30 },
        { header: "Response Score", key: "score", width: 30 },
        { header: "Expected Response", key: "expected_response", width: 30 },
        { header: "Expected Response Score", key: "expected_score", width: 30 },
      ];
      let dataToAdd = [];

      for (const row of data) {
        let obj = {
          competency: row?.question?.competency.title,
          question: row?.question?.text,
          response: row?.response?.label,
          expected_response: row.expected_response
            ? row.expected_response.label
            : "-",
          score: row?.response?.score,
          expected_score: row.expected_response
            ? row.expected_response.score
            : "-",
          rater: row?.rater?.category_name,
          type: row?.response?.type.replace(/_/g, " "),
          respondent: row?.survey_respondant
            ? row?.survey_respondant?.respondant?.name
            : row?.survey_external_respondant?.respondant_name,
        };

        dataToAdd.push(obj);
      }

      sheet.addRows(dataToAdd);
    }

    await workbook.xlsx.writeFile(
      `./src/public/media/temp/${
        surveys[0] ? surveys[0].survey_description.title : "Responses"
      }.xlsx`
    );
    return `/media/temp/${
      surveys[0] ? surveys[0].survey_description.title : "Responses"
    }.xlsx`;
  }

  getDecodedToken(token: string) {
    return this.jwtService.decode(token);
  }

  async getAllRespondentsOfSurvey(id: string, is_external: string) {
    let respondents = { rows: [], count: [] };

    if (is_external === "true") {
      respondents = await this.surveyExternalRespondant
        .unscoped()
        .schema(this.requestParams.schema_name)
        .findAndCountAll({
          where: {
            ...getSearchObject(this.requestParams.query, [
              "respondant_email",
              "respondant_name",
            ]),
          },
          ...this.requestParams.pagination,
          group: [
            "respondant_email",
            "respondant_name",
            "SurveyExternalRespondant.id",
          ],
          attributes: [
            "respondant_email",
            "respondant_name",
            ["id", "respondant_id"],
          ],
          include: [
            {
              model: Survey,
              as: "survey",
              attributes: [],
              where: {
                survey_id: id,
              },
            },
          ],
          distinct: true,
        });
    } else {
      respondents = await this.user
        .unscoped()
        .schema(this.requestParams.schema_name)
        .findAndCountAll({
          where: {
            ...getSearchObject(this.requestParams.query, ["email", "name"]),
          },
          ...this.requestParams.pagination,
          group: ['"User"."id"'],
          // attributes: ["id"],
          distinct: true,
          include: [
            {
              model: SurveyRespondant,
              as: "respondant",
              attributes: [],
              where: { status: SurveyRespondantStatus.Ongoing },
              include: [
                {
                  model: Survey,
                  attributes: [],
                  where: {
                    survey_id: id,
                  },
                },
              ],
            },
          ],
          // distinct: true,
        });
    }

    return {
      rows: respondents?.rows,
      count: Array.isArray(respondents.count)
        ? respondents?.count.length
        : respondents?.count,
    };
  }

  async getFullDetailOfSurvey1(token: any) {
    let respondentInclude = [];
    let respondentIncludeComments = [];
    let respondents;
    let responseWhere = {};

    if (!token.is_external) {
      respondents = await SurveyRespondant.schema(
        this.requestParams.schema_name
      ).findAll({
        where: {
          respondant_id: token.id,
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: Survey,
            where: { survey_id: token.survey_id },
          },
        ],
      });
      responseWhere = {
        survey_respondant_id: respondents.map((item) => item.id),
      };

      respondentInclude.push({
        model: SurveyRespondant,
        where: {
          respondant_id: token.id,
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: User,
            attributes: ["email", "id", "name"],
            as: "respondant",
          },

          {
            model: Rater,
            attributes: ["id", ["category_name", "name"], "order"],
          },
        ],
      });
    } else {
      respondents = await SurveyExternalRespondant.schema(
        this.requestParams.schema_name
      ).findAll({
        where: {
          respondant_email: token.email,
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: Survey,
            where: { survey_id: token.survey_id },
          },
        ],
      });
      responseWhere = {
        survey_external_respondant_id: respondents.map((item) => item.id),
      };

      respondentInclude.push({
        model: SurveyExternalRespondant,
        where: {
          respondant_email: token.email,
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: Rater,
            attributes: ["id", ["category_name", "name"], "order"],
          },
        ],
      });
    }

    if (!respondents.length) {
      return { user: null, survey: null };
    }

    if (respondents.every((item) => item.status === SurveyStatus.Completed)) {
      return { user: null, survey: null };
    }

    const surveyDescription = await this.surveyDescription
      .unscoped()
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          id: token.survey_id,
        },
        order: [
          token.is_external
            ? [
                { model: Survey, as: "surveys" },
                {
                  model: SurveyExternalRespondant,
                  as: "survey_external_respondants",
                },
                { model: Rater, as: "rater" },
                "order",
                "ASC",
              ]
            : [
                { model: Survey, as: "surveys" },
                { model: SurveyRespondant, as: "survey_respondants" },
                { model: Rater, as: "rater" },
                "order",
                "ASC",
              ],
        ],
        include: [
          {
            model: Survey,
            include: [
              {
                model: User,
                attributes: ["email", "id", "name"],
              },

              ...respondentInclude,
            ],
          },
        ],
      });

    const questions = await this.question
      .schema(this.requestParams.schema_name)
      .unscoped()
      .findAll({
        subQuery: false,
        order: [
          [
            {
              model: Competency,
              as: "competency",
            },
            "title",
            "ASC",
          ],
          [
            {
              model: QuestionResponse,
              as: "responses",
            },
            "score",
            "ASC",
          ],
          [
            {
              model: QuestionResponse,
              as: "responses",
            },
            "order",
            "ASC",
          ],
          ["createdAt", "DESC"],
        ],
        include: [
          {
            model: Competency.unscoped(),
            attributes: ["id", "title"],
          },
          {
            model: QuestionResponse.unscoped(),
            attributes: [
              "order",
              "score",
              ["id", "value"],
              "type",
              [
                literal(
                  `concat("responses"."label", (case when "responses"."type" = 'likert_scale' then concat(' (', "responses"."score", ')') else '' end))`
                ),
                "label",
              ],
            ],
          },
          {
            model: QuestionnaireQuestion.unscoped(),
            where: {
              questionnaire_id: surveyDescription.questionnaire_id,
            },
            attributes: [],
          },
        ],
      });
    return { surveyDescription, questions };
  }

  async getQuestionDetail(token, id) {
    let respondentInclude = [];

    if (token.is_external === "false") {
      respondentInclude.push({
        model: SurveyRespondant,
        where: {
          respondant_id: token.id,
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: User,
            attributes: ["email", "id", "name"],
            as: "respondant",
          },

          {
            model: Rater,
            attributes: ["id", ["category_name", "name"], "order"],
          },
        ],
      });
    } else {
      respondentInclude.push({
        model: SurveyExternalRespondant,
        where: {
          respondant_email: token.email,
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: Rater,
            attributes: ["id", ["category_name", "name"], "order"],
          },
        ],
      });
    }

    const surveys = await this.survey
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          survey_id: token.survey_id,
        },
        include: [
          {
            model: User,
            attributes: ["email", "id", "name"],
          },
          ...respondentInclude,
          {
            model: SurveyResponse,
            required: false,
            where: {
              question_id: id,
            },
            include: [
              {
                model: SurveyRespondant,
                where: {
                  respondant_id: token.id,
                },
              },
            ],
          },
        ],
      });

    return surveys;
  }
}
