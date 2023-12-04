import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/sequelize";
import { literal, Op } from "sequelize";
import { bcrypt, getRandomPassword, getSearchObject } from "src/common/helpers";
import { RequestParamsService } from "src/common/modules";
import { MailsService } from "src/common/modules/mails";
import { Competency } from "src/modules/competencies/models";
import {
  Question,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { QuestionResponseOptions } from "src/modules/competencies/modules/questions/types";
import {
  Questionnaire,
  QuestionnaireQuestion,
} from "src/modules/questionnaires/models";
import { Department } from "src/modules/settings/modules/department/models";
import { Designation } from "src/modules/settings/modules/designation/models";
import { Rater } from "src/modules/settings/modules/rater/models";
import { User } from "src/modules/users/models";
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
  SurveyDescriptionStatus,
  SurveyRespondantStatus,
  SurveyStatus,
} from "../type";
import {
  defaultAttachments,
  defaultContext,
} from "src/common/modules/mails/constants";
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
    private readonly mailsService: MailsService,
    private readonly config: ConfigService,
    @InjectModel(SurveyResponse)
    private readonly surveyResponses: typeof SurveyResponse,
    @InjectModel(Question)
    private readonly question: typeof Question
  ) {}

  async getAllSurveys() {
    return this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findAndCountAll({
        where: {
          ...getSearchObject(this.requestParams.query, ["title", "status"]),
        },
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
            employee_id: this.requestParams.getUser().id,
          },
          required: true,
          attributes: ["id", "status", "no_of_respondents"],
        },
      });
  }

  async getOneSurvey(id: string) {
    return await this.surveyDescription
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
      this.user.schema(this.requestParams.schema_name).findAll({
        attributes: ["id", "name", "email", "contact"],
        include: [
          {
            model: SurveyRespondant,
            as: "respondant",
            attributes: ["id", "status", "response_date"],
            include: [
              {
                model: Rater,
                attributes: ["name"],
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
              attributes: ["name"],
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
          '$"surveys"."employee_id"$': this.requestParams.getUser().id,
          [Op.and]: {
            '$"surveys->survey_respondants"."survey_id"$': null,
            '$"surveys->survey_external_respondants"."survey_id"$': null,
          },
          "status": {
            [Op.notIn]: [
              SurveyDescriptionStatus.Closed,
              SurveyDescriptionStatus.Terminated,
            ],
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
    const survey = await this.survey
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id },
        attributes: ["survey_id", "status"],
        include: [
          {
            model: SurveyDescription,
            attributes: ["title", "id", "is_lm_approval_required"],
          },
          {
            model: User,
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
      });

    const raters = await this.rater
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          name: { [Op.ne]: "Self" },
          survey_description_id: survey ? survey.survey_id : undefined,
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

    return {
      raters,
      user: survey.employee,
      surveyDescription: survey.survey_description,
      survey,
    };
  }

  async getAllPendingApprovalSurvey() {
    return this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findAndCountAll({
        ...this.requestParams.pagination,
        distinct: true,
        where: {
          "status": SurveyDescriptionStatus.PendingApproval,
          '$"surveys->employee"."line_manager_id"$':
            this.requestParams.getUser().id,
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
            attributes: [
              "id",
              "name",
              "email",
              "contact",
              "is_lm_approval_required",
            ],
            where: { line_manager_id: this.requestParams.getUser().id },
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
          status: {
            [Op.notIn]: [
              SurveyDescriptionStatus.Closed,
              SurveyDescriptionStatus.Terminated,
            ],
          },
        },
        ...this.requestParams.pagination,
        subQuery: false,
        include: {
          model: Survey,
          attributes: ["id", "status"],
          where: {
            employee_id: this.requestParams.getUser().id,
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

  async getFullDetailOfSurveyForSingleRatee(id: string) {
    const token: any = await this.jwtService.decode(id);

    if (!token) {
      return { user: null, survey: null };
    }

    // await this.sequelize.query(`set search_path to ${token.schema_name}`);

    let surveyRespondant;

    if (token.is_external) {
      surveyRespondant = await this.surveyExternalRespondant
        .schema(token.schema_name)
        .findOne({
          where: { id: token?.respondant_id },
        });
    } else {
      surveyRespondant = await this.surveyRespondant
        .schema(token.schema_name)
        .findOne({
          where: { id: token?.respondant_id },
        });
    }

    if (surveyRespondant?.status !== SurveyStatus.Ongoing) {
      return { user: null, survey: null };
    }

    const survey = await this.surveyDescription
      .schema(token.schema_name)
      .findOne({
        attributes: [
          "id",
          "title",
          "description",
          "end_date",
          "status",
          "questionnaire_id",
          "createdAt",
        ],
        order: [
          [
            {
              model: Questionnaire,
              as: "questionnaire",
            },
            {
              model: Question,
              as: "questions",
            },
            {
              model: Competency,
              as: "competency",
            },
            "title",
            "ASC",
          ],
          [
            {
              model: Questionnaire,
              as: "questionnaire",
            },
            {
              model: Question,
              as: "questions",
            },
            {
              model: QuestionResponse,
              as: "responses",
            },
            "order",
            "DESC",
          ],
          [
            {
              model: Questionnaire,
              as: "questionnaire",
            },
            {
              model: Question,
              as: "questions",
            },
            {
              model: QuestionResponse,
              as: "responses",
            },
            "order",
            "DESC",
          ],
        ],
        include: [
          {
            model: Survey,
            where: {
              id: surveyRespondant?.survey_id,
              status: SurveyStatus.Ongoing,
            },
            attributes: ["id", "status", "survey_id"],
          },
          {
            model: Questionnaire,
            attributes: ["id", "title", "description", "no_of_questions"],
            required: false,
            where: { is_copy: true },
            include: [
              {
                attributes: ["id", "text", "response_type"],
                model: Question,
                required: false,
                through: { attributes: [] },
                where: { is_copy: true },
                include: [
                  {
                    model: Competency,
                    attributes: [
                      "id",
                      "title",
                      "description",
                      "no_of_questions",
                      "type",
                    ],
                    required: false,
                    where: { is_copy: true },
                    include: [
                      {
                        model: CompetencyComment,
                        required: false,
                        where: {
                          [Op.or]: [
                            {
                              survey_respondent_id: surveyRespondant.id,
                            },
                            {
                              survey_external_respondent_id:
                                surveyRespondant.id,
                            },
                          ],
                        },
                      },
                    ],
                  },
                  {
                    model: QuestionResponse,
                    required: false,
                    attributes: [
                      "score",
                      ["id", "value"],
                      "type",
                      [
                        literal(`concat("questionnaire->questions->responses"."label", (case
                        when "questionnaire->questions->responses"."type" = 'likert_scale' then concat(' (', "questionnaire->questions->responses"."score", ')')
                        else ''
                        end))`),
                        "label",
                      ],
                    ],
                    where: { is_copy: true },
                  },
                  {
                    model: SurveyResponse,
                    required: false,
                    where: {
                      [Op.or]: {
                        survey_respondant_id: surveyRespondant.id,
                        survey_external_respondant_id: surveyRespondant.id,
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      });

    const user = await this.user.schema(token.schema_name).findOne({
      attributes: ["name", "email", "createdAt"],
      subQuery: false,
      include: [
        {
          model: Survey,
          where: { id: surveyRespondant.survey_id },
          attributes: ["id", "status"],
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

    return { survey, user };
  }

  async getFullDetailOfSurvey(id: string) {
    const token: any = await this.jwtService.decode(id);
    if (!token) {
      return { user: null, survey: null };
    }
    // await this.sequelize.query(`set search_path to ${token.schema_name}`);
    let respondentInclude = [];
    let respondentIncludeComments = [];
    let respondents;
    let responseWhere = {};

    if (!token.is_external) {
      respondents = await SurveyRespondant.schema(token.schema_name).findAll({
        where: {
          respondant_id: token.id,
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [{ model: Survey, where: { survey_id: token.survey_id } }],
      });
      responseWhere = {
        survey_respondant_id: respondents.map((item) => item.id),
      };
      respondentIncludeComments.push({
        model: SurveyRespondant,
        where: {
          respondant_id: token.id,
        },
        include: [
          { model: Rater, attributes: ["id", ["category_name", "name"]] },
        ],
      });
      respondentInclude.push({
        model: SurveyRespondant,
        where: {
          respondant_id: token.id,
        },
        include: [
          {
            model: User,
            attributes: ["email", "id", "name"],
            as: "respondant",
          },

          { model: Rater, attributes: ["id", ["category_name", "name"]] },
        ],
      });
    } else {
      respondents = await SurveyExternalRespondant.schema(
        token.schema_name
      ).findAll({
        where: {
          respondant_email: token.email,
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [{ model: Survey, where: { survey_id: token.survey_id } }],
      });
      responseWhere = {
        survey_external_respondant_id: respondents.map((item) => item.id),
      };
      respondentIncludeComments.push({
        model: SurveyExternalRespondant,
        where: {
          respondant_email: token.email,
        },
        include: [
          { model: Rater, attributes: ["id", ["category_name", "name"]] },
        ],
      });
      respondentInclude.push({
        model: SurveyExternalRespondant,
        where: {
          respondant_email: token.email,
        },
        include: [
          { model: Rater, attributes: ["id", ["category_name", "name"]] },
        ],
      });
    }

    if (!respondents.length) {
      return { user: null, survey: null };
    }

    const surveyDescription = await this.surveyDescription
      .schema(token.schema_name)
      .findOne({
        where: {
          id: token.survey_id,
          status: SurveyDescriptionStatus.Ongoing,
        },
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
      .schema(token.schema_name)
      .unscoped()
      .findAll({
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
        ],
        include: [
          {
            model: Competency.unscoped(),
            attributes: ["id", "title"],
            include: [
              {
                model: CompetencyComment,
                required: false,
                include: [
                  ...respondentIncludeComments,
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
            attributes: [],
          },
          {
            model: SurveyResponse,
            required: false,
            as: "surveyResponses",
            where: responseWhere,
          },
        ],
      });

    return { questions: questions, surveyDescription };
  }

  async getSurveyToken(id: string) {
    let tokens = [];
    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          id,
        },
        include: [
          {
            model: Survey,
            include: [
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
          },
        ],
      });

    if (
      [
        SurveyDescriptionStatus.Initiated.toString(),
        SurveyDescriptionStatus.In_Progress.toString(),
      ].includes(surveyDescription.status)
    ) {
      for (const survey of surveyDescription.surveys) {
        if (survey.status === SurveyStatus.Initiated) {
          await this.sendToRepondentForInitiated(
            survey.employee,
            surveyDescription
          );
        }
      }
    } else if (
      [SurveyDescriptionStatus.PendingApproval.toString()].includes(
        surveyDescription.status
      )
    ) {
      for (const survey of surveyDescription.surveys) {
        if (SurveyStatus.Suggested_by_EMP === survey.status) {
          await this.sendToLMForSuggestion(survey, surveyDescription);
        } else if (SurveyStatus.Suggested_by_LM === survey.status) {
          this.sendToRequesterForSuggestion(survey, surveyDescription);
        } else if (SurveyStatus.In_Progress === survey.status) {
          await this.sendToRepondentForInProgress(survey, surveyDescription);
        }
      }
    } else if (surveyDescription.status === SurveyDescriptionStatus.Ongoing) {
      if (surveyDescription?.response_form === "Multiple Ratee") {
        try {
          const respondents = await this.surveyRespondant
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
                    status: SurveyRespondantStatus.Ongoing,
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
                    status: SurveyRespondantStatus.Ongoing,
                    survey_id: surveyDescription.id,
                  },
                },
              ],
            });

          console.log(externalRespondants);

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
                surveyDescription,
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
                surveyDescription,
                tokens,
                url
              );
              alreadySentExternal.push(
                externalRespondants[index].respondant_email
              );
            }
          }
          this.mailsService.sendTokens(tokens);
        } catch (error) {
          throw error;
        }
      } else {
        try {
          for (const element of surveyDescription.surveys) {
            if (element.status === "Ongoing") {
              const respondents = await this.surveyRespondant
                .schema(this.requestParams.schema_name)
                .findAll({
                  where: {
                    survey_id: element.id,
                    status: SurveyRespondantStatus.Ongoing,
                  },
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
                .schema(this.requestParams.schema_name)
                .findAll({
                  where: {
                    survey_id: element.id,
                    status: SurveyRespondantStatus.Ongoing,
                  },
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
                    surveyDescription,
                    tokens,
                    url
                  );
                }
                if (externalRespondents[index]) {
                  await this.sendToExternalRespondent(
                    externalRespondents[index],
                    surveyDescription,
                    tokens,
                    url
                  );
                }
              }

              this.mailsService.sendTokens(tokens);
            }
          }
        } catch (error) {
          throw error;
        }
      }
      // for (const survey of surveyDescription.surveys) {
      //   if (survey.status === SurveyStatus.Ongoing) {
      //     const respondents = await this.surveyRespondant
      //       .schema(this.requestParams.schema_name)
      //       .findAll({
      //         where: {
      //           status: SurveyRespondantStatus.Ongoing,
      //         },
      //         include: [
      //           {
      //             attributes: [],
      //             model: Survey,
      //             where: {
      //               id: survey.id,
      //             },
      //           },
      //           {
      //             model: User,
      //             attributes: ["name", "email", "id"],
      //           },
      //           { model: Rater },
      //         ],
      //       });
      //     const externalRespondants = await this.surveyExternalRespondant
      //       .schema(this.requestParams.schema_name)
      //       .unscoped()
      //       .findAll({
      //         where: {
      //           status: SurveyRespondantStatus.Ongoing,
      //         },
      //         include: [
      //           {
      //             attributes: [],
      //             model: Survey,
      //             where: {
      //               id: survey.id,
      //             },
      //           },
      //         ],
      //       });
      //     const maxLength = Math.max(
      //       respondents.length,
      //       externalRespondants.length
      //     );
      //     let alreadySent = [];
      //     let alreadySentExternal = [];
      //     let tokens = [];
      //     const url =
      //       surveyDescription.response_form === "Multiple Ratee"
      //         ? "multiple"
      //         : "single";
      //     for (let index = 0; index < maxLength; index++) {
      //       if (
      //         respondents[index] &&
      //         !alreadySent.includes(respondents[index].respondant.email)
      //       ) {
      //         await this.sendToRepondent(
      //           respondents[index],
      //           survey,
      //           tokens,
      //           url
      //         );
      //         alreadySent.push(respondents[index].respondant.email);
      //       }
      //       if (
      //         externalRespondants[index] &&
      //         !alreadySentExternal.includes(
      //           externalRespondants[index].respondant_email
      //         )
      //       ) {
      //         await this.sendToExternalRespondent(
      //           externalRespondants[index],
      //           survey,
      //           tokens,
      //           url
      //         );
      //         alreadySentExternal.push(
      //           externalRespondants[index].respondant_email
      //         );
      //       }
      //     }
      //     this.mailsService.sendTokens(tokens);
      //   }
      // }
    }

    return tokens;
  }

  async sendToRepondent(
    resp: SurveyRespondant,
    survey_description: SurveyDescription,
    tokens?: string[],
    url?: string
  ) {
    const token = await this.jwtService.signAsync({
      id: resp.respondant_id,
      respondant_id: resp.id,
      survey_id: survey_description.id,
      schema_name: this.requestParams.tenant.schema_name,
      is_external: false,
    });
    if (tokens) {
      tokens.push(token);
    }

    let Mail = {
      to: resp.respondant.email,
      subject: `Request to fill feedback survey | ${survey_description.title}`,
      context: {
        link: `${this.config.get("FE_URL")}/survey/assessment/${url}/${token}`,
        username: resp.respondant.name,
        logo: "cid:company-logo",
        survey_name: survey_description.title,
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
    survey_description: SurveyDescription,
    tokens?: string[],
    url?: any
  ) {
    const token = await this.jwtService.signAsync({
      email: resp.respondant_email,
      schema_name: this.requestParams.tenant.schema_name,
      is_external: true,
      survey_id: survey_description.id,
      respondant_id: resp.id,
    });

    if (tokens) {
      tokens.push(token);
    }
    let Mail = {
      to: resp.respondant_email,
      subject: `Request to fill feedback survey | ${survey_description.title}`,
      context: {
        link: `${this.config.get("FE_URL")}/survey/assessment/${url}/${token}`,
        username: resp.respondant_name,
        logo: "cid:company-logo",
        survey_name: survey_description.title,
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

  async sendToRepondentForInitiated(
    resp: User,
    surveyDescription: SurveyDescription
  ) {
    let Mail = {
      to: resp.email,
      subject: `Request to nominate Respondents | New Survey Created | ${surveyDescription.title}`,
      context: {
        email: resp.email,
        is_already_created: true,
        is_lm_approval_req: !resp.is_lm_approval_required
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

  async sendToRepondentForInProgress(
    resp: Survey,
    surveyDescription: SurveyDescription
  ) {
    let password = "";
    if (!resp.employee.line_manager.password) {
      password = getRandomPassword();
      let hashPassword = await bcrypt.createHash(password);
      await resp.employee.line_manager.update(
        {
          password: hashPassword,
        }
        // { transaction }
      );
    }
    let Mail = {
      to: resp.employee.line_manager.email,
      subject: `Respondent Nomination Approval Request | ${surveyDescription.title}`,
      context: {
        link: `${this.config.get("FE_URL")}/survey/approval-requests/${
          surveyDescription.id
        }/${resp.id}`,
        username: resp.employee.line_manager.name,
        email: resp.employee.line_manager.email,
        password,
        is_new_user: Boolean(password),
        requester: `${resp.employee.name} ${
          resp.employee.designation ? `(${resp.employee.designation.name})` : ""
        }`,
        survey_name: surveyDescription.title,
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

  async getResponsesExcel(id: string) {
    const surveys = await this.survey
      .schema(this.requestParams.schema_name)
      .findAll({
        where: { survey_id: id },
        include: [
          {
            model: User,
            attributes: ["name"],
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

      const sheet = workbook.addWorksheet(survey.employee.name, {
        views: [{ state: "frozen", ySplit: 1 }],
      });

      sheet.columns = [
        { header: "Competency", key: "competency", width: 50 },
        { header: "Question", key: "question", width: 100 },
        { header: "Type", key: "type", width: 30 },
        { header: "Response", key: "response", width: 30 },
        { header: "Score", key: "score", width: 30 },
        { header: "Respondent", key: "respondent", width: 30 },
        { header: "Rater", key: "rater", width: 30 },
      ];
      let dataToAdd = [];

      for (const row of data) {
        let obj = {
          competency: row?.question?.competency.title,
          question: row?.question?.text,
          response: row?.response?.label,
          score: row?.response?.score,
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

  async sendToRequesterForSuggestion(
    survey: Survey,
    surveyDescription: SurveyDescription
  ) {
    let Mail = {
      to: survey.employee.email,
      subject: `Alternate Respondent suggested by Line Manager | ${surveyDescription.title}`,
      context: {
        link: `${this.config.get("FE_URL")}/survey/approval-requests/${
          surveyDescription.id
        }/${survey.id}`,
        username: survey.employee.line_manager.name,
        logo: "cid:company-logo",
        requester: `${survey.employee.name} (${survey.employee.designation.name})`,
        survey_name: surveyDescription.title,
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
  async sendToLMForSuggestion(
    survey: Survey,
    surveyDescription: SurveyDescription
  ) {
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
      subject: `Approval Request for Alternate Nomination | ${surveyDescription.title}`,
      context: {
        link: `${this.config.get("FE_URL")}/survey/approval-requests/${
          surveyDescription.id
        }/${survey.id}`,
        username: survey.employee.line_manager.name,
        email: survey.employee.line_manager.email,
        password,
        is_new_user: Boolean(password),
        logo: "cid:company-logo",
        requester: `${survey.employee.name} (${survey.employee.designation.name})`,
        survey_name: surveyDescription.title,
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
  }
}
