import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { existsSync, writeFileSync } from "fs";
import { literal, Sequelize } from "sequelize";
import { getShortFrom, printPDF } from "src/common/helpers";
import { MailsService } from "src/common/modules/mails";
import {
  defaultAttachments,
  defaultContext,
} from "src/common/modules/mails/constants";
import { Competency } from "../competencies/models";
import {
  Question,
  QuestionResponse,
} from "../competencies/modules/questions/models";
import { QuestionResponseOptions } from "../competencies/modules/questions/types";
import { Questionnaire } from "../questionnaires/models";
import { Designation } from "../settings/modules/designation/models";
import { Rater } from "../settings/modules/rater/models";
import {
  CompetencyComment,
  Survey,
  SurveyDescription,
  SurveyExternalRespondant,
  SurveyRespondant,
  SurveyResponse,
} from "../surveys/models";
import { SurveyStatus } from "../surveys/type";
import { User } from "../users/models";
import * as moment from "moment";
import { RequestParamsService } from "src/common/modules";
import { Tenant, TenantUser } from "../tenants/models";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
const ExcelJS = require("exceljs");

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(User) private readonly user: typeof User,
    @InjectModel(Competency) private readonly competency: typeof Competency,
    @InjectModel(SurveyDescription)
    private readonly surveyDescription: typeof SurveyDescription,
    @InjectModel(Rater) private readonly rater: typeof Rater,
    @InjectModel(Survey) private readonly survey: typeof Survey,
    @InjectModel(Questionnaire)
    private readonly questionnaire: typeof Questionnaire,
    @InjectModel(Tenant)
    private readonly tenant: typeof Tenant,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailsService: MailsService,
    private readonly requestParams: RequestParamsService
  ) {}

  async genratePDF(token: string) {
    const data = (await this.jwtService.decode(token)) as any;
    if (existsSync(`src/public/media/reports/report-${data.survey_id}.pdf`)) {
      return `src/public/media/reports/report-${data.survey_id}.pdf`;
    } else {
      const pdf = await printPDF(data);
      if (pdf) {
        writeFileSync(
          `src/public/media/reports/report-${data.survey_id}.pdf`,
          pdf
        );
        await this.survey.schema(data.schema_name).update(
          {
            report_path: `/media/reports/report-${data.survey_id}.pdf`,
          },
          { where: { id: data.survey_id } }
        );
        return `src/public/media/reports/report-${data.survey_id}.pdf`;
      }
    }
  }

  async getPDFToken(body: any) {
    return this.jwtService.sign(body);
  }

  async introDetail(id: string) {
    // await this.sequelize.query(
    //   `set search_path to ${this.requestParams.tenant.schema_name}`
    // );
    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.tenant.schema_name)
      .findOne({
        include: [
          {
            model: Survey,
            where: { id },
            required: true,
          },
        ],
      });

    const introDetail = await this.user
      .schema(this.requestParams.tenant.schema_name)
      .findOne({
        attributes: ["id", "name", "email", "contact", "createdAt"],
        include: [
          {
            model: Survey,
            where: {
              id,
              status: SurveyStatus.Completed,
            },
            include: [
              {
                model: SurveyRespondant,
                include: [
                  {
                    model: User,
                    attributes: ["name", "email", "contact"],
                    include: [
                      {
                        model: Designation,
                        attributes: ["name"],
                      },
                    ],
                  },
                  {
                    model: Rater,
                    attributes: [["category_name", "name"]],
                  },
                ],
              },
              {
                model: SurveyExternalRespondant,
                include: [
                  {
                    model: Rater,
                    attributes: [["category_name", "name"]],
                  },
                ],
              },
            ],
          },
          {
            model: Designation,
            attributes: ["name"],
          },
        ],
      });

    if (!introDetail) throw new NotFoundException("User Not Found!");

    return {
      introDetail: introDetail,
      genratedAt: moment(new Date()).format("llll"),
      surveyDescription,
    };
  }

  async compRatingDescending(id: string, survey_id?: string) {
    // await this.sequelize.query(
    //   `set search_path to ${this.requestParams.tenant.schema_name}`
    // );
    const data = await this.competency
      .schema(this.requestParams.tenant.schema_name)
      .findAll({
        where: { is_copy: true },
        attributes: [
          "id",
          [
            literal(
              `concat("Competency"."title", ' (', "Competency"."type",')')`
            ),
            "title",
          ],
          "benchmark",
        ],
        include: [
          {
            model: Questionnaire,
            attributes: [],
            where: {
              id,
              is_copy: true,
            },
          },
          {
            model: Question,
            attributes: ["id", "text", "competency_id"],
            required: false,
            where: {
              max_score: 5,
              is_copy: true,
              response_type: QuestionResponseOptions.likert_scale,
            },
            include: [
              {
                model: SurveyResponse,
                as: "surveyResponses",
                where: {
                  survey_id,
                },
                attributes: [
                  "id",
                  "survey_respondant_id",
                  "survey_external_respondant_id",
                ],
                include: [
                  {
                    model: Rater,
                    attributes: ["name"],
                  },
                  {
                    model: QuestionResponse,
                    attributes: ["id", "score"],
                    where: { is_copy: true },
                  },
                ],
              },
            ],
          },
        ],
      });

    let newData = [];
    for (const comp of data) {
      if (!comp.questions.length) {
        continue;
      }
      let value = 0;
      let count = 0;
      let selfCount = 0;
      let self = 0;
      for (const ques of comp.questions) {
        for (const resp of ques.surveyResponses) {
          if (resp.rater.name === "Self") {
            selfCount++;
            self += resp.response.score;
          } else {
            count++;
            value += resp.response.score;
          }
        }
      }

      newData.push({
        name: comp.title,
        value: +((value / count) as number).toFixed(2),
        self: +((self / selfCount) as number).toFixed(2),
        benchmark: comp.benchmark,
      });
    }
    const allComp = newData.sort((a, b) => b.value - a.value);
    return allComp;
  }

  async avgPerRoalGroup(id: string, survey_id?: string) {
    // await this.sequelize.query(
    //   `set search_path to ${this.requestParams.tenant.schema_name}`
    // );
    const raters = await this.rater
      .schema(this.requestParams.tenant.schema_name)
      .findAll({
        attributes: ["category_name", "id", "is_external", "short_name"],
      });
    const data = await this.competency
      .schema(this.requestParams.tenant.schema_name)
      .findAll({
        where: { is_copy: true },
        attributes: [
          [
            literal(
              `concat("Competency"."title", ' (', "Competency"."type",')')`
            ),
            "title",
          ],
          "id",
        ],
        include: [
          {
            model: Questionnaire,
            attributes: [],
            where: {
              id,
              is_copy: true,
            },
          },
          {
            model: Question,
            attributes: ["text", "id"],
            required: false,
            where: {
              max_score: 5,
              is_copy: true,
              response_type: QuestionResponseOptions.likert_scale,
            },
            include: [
              {
                model: SurveyResponse,
                as: "surveyResponses",
                where: {
                  survey_id,
                },
                include: [
                  {
                    model: Rater,
                    attributes: ["category_name", "is_external", "short_name"],
                  },
                  {
                    model: QuestionResponse,
                    where: { is_copy: true },
                  },
                ],
              },
            ],
          },
        ],
      });
    let roleObj = {};

    for (const rater of raters) {
      if (!rater.is_external) {
        roleObj[rater.id] = {
          x: rater.short_name,
          y: 0,
          count: 0,
        };
      }
    }

    roleObj = {
      ...roleObj,
      avg: { x: "Avg", y: 0, count: 0 },
      other: { x: "Other", y: 0, count: 0 },
    };
    let newData = [];

    for (const comp of data) {
      if (!comp.questions.length) {
        continue;
      }
      let currObj = { ...roleObj };
      for (const question of comp.questions) {
        for (const surResp of question.surveyResponses) {
          if (surResp.rater.name !== "Self") {
            if (surResp.rater.is_external) {
              currObj["other"] = {
                ...currObj["other"],
                y: currObj["other"].y + surResp.response.score || 0,
                count: currObj["other"].count + 1,
              };
            } else {
              currObj[surResp.category_id] = {
                ...currObj[surResp.category_id],
                y: currObj[surResp.category_id].y + surResp.response.score,
                count: currObj[surResp.category_id].count + 1,
              };
            }
            currObj["avg"] = {
              ...currObj["avg"],
              y: currObj["avg"].y + surResp.response.score,
              count: currObj["avg"].count + 1,
            };
          } else {
            currObj["self"] = {
              ...currObj["self"],
              y: currObj["self"].y + surResp.response.score,
              count: currObj["self"].count + 1,
            };
          }
        }
      }

      newData.push({
        name: comp.title,
        data: Object.values(currObj).map((item: any) => ({
          ...item,
          y: +((item.y / item.count) as number).toFixed(1) || 0,
        })),
      });
    }

    return newData;
  }

  async likertScaleReport(id: string, survey_id?: string) {
    // await this.sequelize.query(
    //   `set search_path to ${this.requestParams.tenant.schema_name}`
    // );
    const data = await this.questionnaire
      .schema(this.requestParams.tenant.schema_name)
      .findOne({
        where: {
          id,
          is_copy: true,
        },
        order: [
          [
            {
              model: Question,
              as: "questions",
            },
            {
              model: QuestionResponse,
              as: "responses",
            },
            "score",
            "ASC",
          ],
          [
            {
              model: Question,
              as: "questions",
            },
            {
              model: Competency,
              as: "competency",
            },
            "id",
            "ASC",
          ],
        ],
        include: [
          {
            model: Question,
            attributes: ["text", "id"],
            where: {
              is_copy: true,
              response_type: QuestionResponseOptions.likert_scale,
            },
            required: false,
            include: [
              {
                model: Competency,
                where: { is_copy: true },
                attributes: [
                  [
                    literal(
                      `concat("questions->competency"."title", ' (', "questions->competency"."type",')')`
                    ),
                    "title",
                  ],
                  "id",
                ],
              },
              {
                model: QuestionResponse,
                where: { is_copy: true },
                include: [
                  {
                    model: SurveyResponse,
                    required: false,
                    where: {
                      survey_id,
                    },
                    include: [
                      {
                        model: Rater,
                        attributes: [
                          "category_name",
                          "is_external",
                          "short_name",
                          "name",
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

    let raterIds = [];
    let questions = [];
    for (const question of data.questions) {
      let responses = [];
      let chartData = [];
      let names = [];
      let scores = [];
      let roleDataObj = {
        Other: {
          score: 0,
          count: 0,
        },
        Avg: {
          score: 0,
          count: 0,
        },
      };
      for (const resp of question.responses) {
        let dataCountObj = {
          Other: null,
        };

        for (const surResp of resp.survey_responses) {
          let shortName =
            surResp.rater.short_name ||
            getShortFrom(surResp.rater.category_name);

          if (surResp.rater.is_external) {
            dataCountObj["Other"] = dataCountObj["Other"]
              ? dataCountObj["Other"] + 1
              : 1;

            roleDataObj["Other"] = roleDataObj["Other"]
              ? {
                  count: roleDataObj["Other"].count + 1,
                  score: roleDataObj["Other"].score + resp.score,
                }
              : { count: 1, score: resp.score };
          } else {
            dataCountObj[shortName] = dataCountObj[shortName]
              ? dataCountObj[shortName] + 1
              : 1;

            roleDataObj[shortName] = roleDataObj[shortName]
              ? {
                  count: roleDataObj[shortName].count + 1,
                  score: roleDataObj[shortName].score + resp.score,
                }
              : { count: 1, score: resp.score };
          }
          if (surResp.rater.name !== "Self") {
            roleDataObj["Avg"] = {
              count: roleDataObj["Avg"].count + 1,
              score: roleDataObj["Avg"].score + resp.score,
            };
          }
        }

        raterIds = [...raterIds, ...Object.keys(dataCountObj)];
        responses.push({
          id: resp.id,
          label: resp.label,
          score: resp.score,
          ...dataCountObj,
        });
      }

      for (const key in roleDataObj) {
        names.push(key);
        scores.push(
          +(
            (roleDataObj[key].score / roleDataObj[key].count) as number
          ).toFixed(1)
        );
        chartData.push({
          name: key,
          value: +(
            (roleDataObj[key].score / roleDataObj[key].count) as number
          ).toFixed(1),
        });
      }

      questions.push({
        id: question.id,
        text: question.text,
        chartData,
        names,
        scores,
        responses: responses,
        competency: question.competency,
      });
    }
    return { data: questions, raters: [...new Set(raterIds)] };
  }

  async mcqReport(id: string, survey_id?: string) {
    // await this.sequelize.query(
    //   `set search_path to ${this.requestParams.tenant.schema_name}`
    // );

    const data = await this.questionnaire
      .schema(this.requestParams.tenant.schema_name)
      .findOne({
        where: {
          id,
          is_copy: true,
        },
        order: [
          [
            {
              model: Question,
              as: "questions",
            },
            {
              model: QuestionResponse,
              as: "responses",
            },
            "order",
            "ASC",
          ],
          [
            {
              model: Question,
              as: "questions",
            },
            {
              model: Competency,
              as: "competency",
            },
            "id",
            "ASC",
          ],
        ],
        include: [
          {
            model: Question,
            attributes: ["text", "id"],
            required: false,
            where: {
              is_copy: true,
              response_type: QuestionResponseOptions.multiple_choice,
            },
            include: [
              {
                model: Competency,
                where: { is_copy: true },
                attributes: [
                  [
                    literal(
                      `concat("questions->competency"."title", ' (', "questions->competency"."type",')')`
                    ),
                    "title",
                  ],
                  "id",
                ],
              },
              {
                model: QuestionResponse,
                where: { is_copy: true },
                include: [
                  {
                    required: false,
                    model: SurveyResponse,
                    where: {
                      survey_id,
                    },
                    include: [
                      {
                        model: Rater,
                        attributes: [
                          "category_name",
                          "is_external",
                          "short_name",
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

    let raterIds = ["Other"];
    let questions = [];
    for (const question of data.questions) {
      let responses = [];
      let chartData = {};
      for (const resp of question.responses) {
        let dataCountObj = {
          Other: null,
        };
        for (const surResp of resp.survey_responses) {
          if (surResp.rater) {
            if (surResp.rater.is_external) {
              dataCountObj["Other"] = dataCountObj["Other"]
                ? dataCountObj["Other"] + 1
                : 1;
              chartData["Other"] = chartData["Other"]
                ? {
                    ...chartData["Other"],
                    [resp.label]: chartData["Other"][resp.label]
                      ? chartData["Other"][resp.label] + 1
                      : 1,
                  }
                : {
                    name: "Other",
                    [resp.label]: 1,
                  };
            } else {
              let shortName = surResp.rater.short_name;
              dataCountObj[shortName] = dataCountObj[shortName]
                ? dataCountObj[shortName] + 1
                : 1;
              chartData[shortName] = chartData[shortName]
                ? {
                    ...chartData[shortName],
                    [resp.label]: chartData[shortName][resp.label]
                      ? chartData[shortName][resp.label] + 1
                      : 1,
                  }
                : {
                    name: shortName,
                    [resp.label]: 1,
                  };

              raterIds = [...raterIds, surResp.rater.short_name];
            }
          }
        }
        responses.push({
          id: resp.id,
          label: resp.label,
          ...dataCountObj,
        });
      }

      questions.push({
        id: question.id,
        text: question.text,
        responses: responses,
        chartData: Object.values(chartData),
        competency: question.competency,
      });
    }

    return { data: questions, raters: [...new Set(raterIds)] };
  }

  async yesNoReport(id: string, survey_id?: string) {
    // await this.sequelize.query(
    //   `set search_path to ${this.requestParams.tenant.schema_name}`
    // );
    const data = await this.questionnaire
      .schema(this.requestParams.tenant.schema_name)
      .findOne({
        where: {
          id,
          is_copy: true,
        },
        order: [
          [
            {
              model: Question,
              as: "questions",
            },
            "response_type",
            "DESC",
          ],
          [
            {
              model: Question,
              as: "questions",
            },
            {
              model: QuestionResponse,
              as: "responses",
            },
            "order",
            "ASC",
          ],
          [
            {
              model: Question,
              as: "questions",
            },
            {
              model: Competency,
              as: "competency",
            },
            "id",
            "ASC",
          ],
        ],
        include: [
          {
            model: Question,
            attributes: ["text", "id", "response_type"],
            required: false,
            where: {
              is_copy: true,
              response_type: [
                QuestionResponseOptions.single_choice,
                QuestionResponseOptions.yes_no,
              ],
            },
            include: [
              {
                model: Competency,
                where: { is_copy: true },
                attributes: [
                  [
                    literal(
                      `concat("questions->competency"."title", ' (', "questions->competency"."type",')')`
                    ),
                    "title",
                  ],
                  "id",
                ],
              },
              {
                model: QuestionResponse,
                where: { is_copy: true },
                include: [
                  {
                    model: SurveyResponse,
                    required: false,
                    where: {
                      survey_id,
                    },
                    include: [
                      {
                        model: Rater,
                        attributes: [
                          "category_name",
                          "is_external",
                          "short_name",
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

    let raterIds = ["Other"];
    let questions = [];
    for (const question of data.questions) {
      let responses = [];
      let chartData = {};
      for (const resp of question.responses) {
        let dataCountObj = {
          Other: null,
        };
        for (const surResp of resp.survey_responses) {
          if (surResp.rater) {
            if (surResp.rater.is_external) {
              dataCountObj["Other"] = dataCountObj["Other"]
                ? dataCountObj["Other"] + 1
                : 1;
              chartData["Other"] = chartData["Other"]
                ? {
                    ...chartData["Other"],
                    [resp.label]: chartData["Other"][resp.label]
                      ? chartData["Other"][resp.label] + 1
                      : 1,
                  }
                : {
                    name: "Other",
                    [resp.label]: 1,
                  };
            } else {
              let shortName = surResp.rater.short_name;
              dataCountObj[shortName] = dataCountObj[shortName]
                ? dataCountObj[shortName] + 1
                : 1;
              chartData[shortName] = chartData[shortName]
                ? {
                    ...chartData[shortName],
                    [resp.label]: chartData[shortName][resp.label]
                      ? chartData[shortName][resp.label] + 1
                      : 1,
                  }
                : {
                    name: shortName,
                    [resp.label]: 1,
                  };

              raterIds = [...raterIds, surResp.rater.short_name];
            }
          }
        }
        responses.push({
          id: resp.id,
          label: resp.label,
          ...dataCountObj,
        });
      }

      questions.push({
        id: question.id,
        text: question.text,
        responses: responses,
        response_type: question.response_type,
        chartData: Object.values(chartData),
        competency: question.competency,
      });
    }
    return { data: questions, raters: [...new Set(raterIds)] };
  }

  async commentsReport(id: string, survey_id?: string) {
    // await this.sequelize.query(
    //   `set search_path to ${this.requestParams.tenant.schema_name}`
    // );

    const competencies = await this.competency
      .schema(this.requestParams.tenant.schema_name)
      .findAll({
        where: { is_copy: true },
        attributes: ["title", "id"],
        order: [
          [
            { model: CompetencyComment, as: "comments" },
            { model: SurveyRespondant, as: "survey_respondent" },
            { model: Rater, as: "rater" },
            "order",
            "DESC",
          ],
          [
            { model: CompetencyComment, as: "comments" },
            {
              model: SurveyExternalRespondant,
              as: "survey_external_respondent",
            },
            { model: Rater, as: "rater" },
            "order",
            "DESC",
          ],
          [
            { model: Question, as: "questions" },
            { model: SurveyResponse, as: "surveyResponses" },
            { model: Rater, as: "rater" },
            "order",
            "DESC",
          ],
        ],
        include: [
          {
            model: Questionnaire,
            attributes: [],
            where: { is_copy: true, id },
          },
          {
            model: CompetencyComment,
            attributes: ["id", "comments", "survey_external_respondent_id"],
            where: {
              survey_id,
            },
            include: [
              {
                attributes: ["id"],
                model: SurveyRespondant,
                include: [
                  {
                    model: Rater,
                    attributes: [["category_name", "catName"], "order"],
                  },
                ],
              },
              {
                model: SurveyExternalRespondant,
                attributes: ["id"],
                include: [
                  {
                    model: Rater,
                    attributes: [["category_name", "catName"], "order"],
                  },
                ],
              },
            ],
          },
          {
            model: Question,
            attributes: ["text", "id"],
            required: false,
            where: {
              is_copy: true,
              response_type: QuestionResponseOptions.text,
            },
            include: [
              {
                as: "surveyResponses",
                model: SurveyResponse,
                required: false,
                attributes: ["id", "response_text"],
                where: {
                  survey_id,
                  response_id: null,
                },
                include: [
                  {
                    model: Rater,
                    attributes: ["category_name", "short_name"],
                  },
                ],
              },
            ],
          },
        ],
      });
    // const data = await this.questionnaire.findOne({
    //   where: {
    //     id,
    //     is_copy: true,
    //   },
    //   order: [
    //     [
    //       {
    //         model: Question,
    //         as: "questions",
    //       },
    //       {
    //         model: Competency,
    //         as: "competency",
    //       },
    //       "title",
    //       "ASC",
    //     ],
    //   ],
    //   attributes: ["id"],
    //   include: [
    //     {
    //       model: Question,
    //       attributes: ["text", "id"],
    //       required: false,
    //       where: {
    //         is_copy: true,
    //         response_type: QuestionResponseOptions.text,
    //       },
    //       include: [
    //         {
    //           model: Competency,
    //           include: [
    //             {
    //               model: CompetencyComment,
    //               include: [
    //                 {
    //                   model: SurveyRespondant,
    //                   include: [
    //                     { model: Rater, attributes: ["category_name"] },
    //                   ],
    //                 },
    //                 {
    //                   model: SurveyExternalRespondant,
    //                   include: [{ model: Rater }],
    //                 },
    //               ],
    //             },
    //           ],
    //           where: { is_copy: true },
    //           attributes: ["title", "id"],
    //         },
    //         {
    //           model: SurveyResponse,
    //           required: false,
    //           attributes: ["id", "response_text"],
    //           where: {
    //             survey_id,
    //             response_id: null,
    //           },
    //           include: [
    //             {
    //               model: Rater,
    //               attributes: ["category_name", "short_name"],
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //   ],
    // });

    return competencies;
  }

  async getReportData(id: any) {
    let data = {};
    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.tenant.schema_name)
      .findOne({
        include: [
          {
            model: Survey,
            where: { id },
            required: true,
          },
        ],
      });

    const introDetail = await this.user
      .schema(this.requestParams.tenant.schema_name)
      .findOne({
        attributes: ["id", "name", "email", "contact", "createdAt"],
        include: [
          {
            model: Survey,
            where: {
              id,
              status: SurveyStatus.Completed,
            },
            include: [
              {
                model: SurveyRespondant,
                include: [
                  {
                    model: User,
                    attributes: ["name", "email", "contact"],
                    include: [
                      {
                        model: Designation,
                        attributes: ["name"],
                      },
                    ],
                  },
                  {
                    model: Rater,
                    attributes: [["category_name", "name"], "order"],
                  },
                ],
              },
              {
                model: SurveyExternalRespondant,
                include: [
                  {
                    model: Rater,
                    attributes: [["category_name", "name"], "order"],
                  },
                ],
              },
            ],
          },
          {
            model: Designation,
            attributes: ["name"],
          },
        ],
      });

    if (!introDetail) throw new NotFoundException("User Not Found!");

    data["introDetail"] = introDetail;

    data["compRatingData"] = await this.compRatingDescending(
      surveyDescription.questionnaire_id,
      id
    );
    data["avgPerRoalGroupData"] = await this.avgPerRoalGroup(
      surveyDescription.questionnaire_id,
      id
    );
    data["likertScaleReportData"] = await this.likertScaleReport(
      surveyDescription.questionnaire_id,
      id
    );

    data["mcqReportData"] = await this.mcqReport(
      surveyDescription.questionnaire_id,
      id
    );
    data["yesNoReportData"] = await this.yesNoReport(
      surveyDescription.questionnaire_id,
      id
    );
    data["commentsReport"] = await this.commentsReport(
      surveyDescription.questionnaire_id,
      id
    );
    return data;
  }

  async genrateReport(survey: SurveyDescription, token: any) {
    // const surveys = await this.survey.schema(token.schema_name).findAll({
    //   where: {
    //     survey_id: survey.id,
    //   },
    //   include: [
    //     {
    //       model: User,
    //       attributes: ["name", "email", "id"],
    //     },
    //     {
    //       model: SurveyDescription,
    //       attributes: ["id", "title"],
    //     },
    //   ],
    // });

    // for (const survey of surveys) {
    //   let userToken = await this.jwtService.signAsync({
    //     id: survey.employee_id,
    //   });
    //   let surveyToken = await this.jwtService.signAsync({
    //     survey_id: survey.id,
    //     schema_name: token.schema_name,
    //     token: userToken,
    //   });

    //   let Mail = {
    //     to: survey.employee.email,
    //     subject: `Survey Completion Report | ${survey.survey_description.title}`,
    //     context: {
    //       link: `${this.config.get(
    //         "BE_URL"
    //       )}/api/v1/reports/dual-gap/report/${surveyToken}`,
    //       username: survey.employee.name,
    //       logo: "cid:company-logo",
    //       ...defaultContext,
    //     },
    //     attachments: [
    //       {
    //         filename: "nbol-email-logo",
    //         path: "src/public/media/images/nbol-email-logo.png",
    //         cid: "company-logo",
    //       },
    //       ...defaultAttachments,
    //     ],
    //   };
    //   this.mailsService.ReportsMail(Mail);
    // }

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
    if (tenant.admin && tenant.admin.email) {
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
        username: channel_partner.users[0].name,
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

  async getReport(survey_id: string) {
    if (existsSync(`src/public/media/reports/report-${survey_id}.pdf`)) {
      return `/media/reports/report-${survey_id}.pdf`;
    } else {
      const token = await this.jwtService.sign({
        id: this.requestParams.user.id,
      });
      const pdf = await printPDF({
        survey_id,
        token,
        schema_name: this.requestParams.tenant.schema_name,
      });
      if (pdf) {
        writeFileSync(`src/public/media/reports/report-${survey_id}.pdf`, pdf);
        await this.survey.schema(this.requestParams.tenant.schema_name).update(
          {
            report_path: `/media/reports/report-${survey_id}.pdf`,
          },
          { where: { id: survey_id } }
        );
        return `/media/reports/report-${survey_id}.pdf`;
      }
    }
  }

  async getQuestionWiseReport(id: string, survey_id?: string) {
    // await this.sequelize.query(
    //   `set search_path to ${this.requestParams.tenant.schema_name}`
    // );
    const data = await this.questionnaire
      .schema(this.requestParams.tenant.schema_name)
      .findOne({
        where: {
          id,
          is_copy: true,
        },
        order: [
          [
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
              model: Question,
              as: "questions",
            },
            "response_type",
            "DESC",
          ],
          [
            {
              model: Question,
              as: "questions",
            },
            {
              model: QuestionResponse,
              as: "responses",
            },
            "score",
            "ASC",
          ],
          [
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
            model: Question,
            attributes: ["text", "id", "response_type"],
            required: false,
            where: {
              is_copy: true,
              response_type: [
                QuestionResponseOptions.likert_scale,
                QuestionResponseOptions.single_choice,
                QuestionResponseOptions.yes_no,
                QuestionResponseOptions.multiple_choice,
              ],
            },
            include: [
              {
                model: Competency,
                where: { is_copy: true },
                attributes: ["title", "id"],
              },
              {
                model: QuestionResponse,
                where: { is_copy: true },
                include: [
                  {
                    model: SurveyResponse,
                    required: false,
                    where: {
                      survey_id,
                    },
                    include: [
                      {
                        model: Rater,
                        attributes: [
                          "category_name",
                          "is_external",
                          "short_name",
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

    let raters = [];
    let singleChoice = [];
    let likertScale = [];
    let multipleChoice = [];

    for (const question of data.questions) {
      if (question.response_type === QuestionResponseOptions.likert_scale) {
        this.getLikertScaleData(question, likertScale, raters);
      } else if (
        question.response_type === QuestionResponseOptions.multiple_choice
      ) {
        this.getChoiceData(question, multipleChoice, raters);
      } else {
        this.getChoiceData(question, singleChoice, raters);
      }
    }

    return {
      singleChoice,
      multipleChoice,
      likertScale,
      raters: [...new Set(raters)],
    };
  }

  async getLikertScaleData(question: Question, array: any[], raters: string[]) {
    let responses = [];
    let names = [];
    let scores = [];
    let roleDataObj = {
      Avg: {
        score: 0,
        count: 0,
      },
    };
    for (const resp of question.responses) {
      let dataCountObj = {};

      for (const surResp of resp.survey_responses) {
        let shortName =
          surResp.rater.short_name || getShortFrom(surResp.rater.category_name);

        if (surResp.rater.is_external) {
          dataCountObj["Other"] = dataCountObj["Other"]
            ? dataCountObj["Other"] + 1
            : 1;

          roleDataObj["Other"] = roleDataObj["Other"]
            ? {
                count: roleDataObj["Other"].count + 1,
                score: roleDataObj["Other"].score + resp.score,
              }
            : { count: 1, score: resp.score };
          raters.push("Other");
        } else {
          dataCountObj[shortName] = dataCountObj[shortName]
            ? dataCountObj[shortName] + 1
            : 1;

          roleDataObj[shortName] = roleDataObj[shortName]
            ? {
                count: roleDataObj[shortName].count + 1,
                score: roleDataObj[shortName].score + resp.score,
              }
            : { count: 1, score: resp.score };

          raters.push(shortName);
        }
        if (surResp.rater.name !== "Self") {
          roleDataObj["Avg"] = {
            count: roleDataObj["Avg"].count + 1,
            score: roleDataObj["Avg"].score + resp.score,
          };
        }
      }

      responses.push({
        id: resp.id,
        label: resp.label,
        score: resp.score,
        ...dataCountObj,
      });
    }

    for (const key in roleDataObj) {
      names.push(key);
      scores.push(
        +((roleDataObj[key].score / roleDataObj[key].count) as number).toFixed(
          1
        )
      );
    }

    array.push({
      id: question.id,
      text: question.text,
      names,
      scores,
      responses: responses,
      competency: question.competency,
    });
  }

  async getChoiceData(question: Question, array: any[], raters: string[]) {
    let responses = [];
    let chartData = {};
    for (const resp of question.responses) {
      let dataCountObj = {};
      for (const surResp of resp.survey_responses) {
        if (surResp.rater) {
          if (surResp.rater.is_external) {
            dataCountObj["Other"] = dataCountObj["Other"]
              ? dataCountObj["Other"] + 1
              : 1;
            chartData["Other"] = chartData["Other"]
              ? {
                  ...chartData["Other"],
                  [resp.label]: chartData["Other"][resp.label]
                    ? chartData["Other"][resp.label] + 1
                    : 1,
                }
              : {
                  name: "Other",
                  [resp.label]: 1,
                };
            raters.push("Other");
          } else {
            let shortName = surResp.rater.short_name;
            dataCountObj[shortName] = dataCountObj[shortName]
              ? dataCountObj[shortName] + 1
              : 1;
            chartData[shortName] = chartData[shortName]
              ? {
                  ...chartData[shortName],
                  [resp.label]: chartData[shortName][resp.label]
                    ? chartData[shortName][resp.label] + 1
                    : 1,
                }
              : {
                  name: shortName,
                  [resp.label]: 1,
                };

            raters.push(surResp.rater.short_name);
          }
        }
      }
      responses.push({
        id: resp.id,
        label: resp.label,
        ...dataCountObj,
      });
    }
    array.push({
      id: question.id,
      text: question.text,
      responses: responses,
      response_type: question.response_type,
      chartData: Object.values(chartData),
      competency: question.competency,
    });
  }

  async getCompitencyLevelReport(id: string, survey_id?: string) {
    // await this.sequelize.query(
    //   `set search_path to ${this.requestParams.tenant.schema_name}`
    // );

    const data = await this.competency
      .schema(this.requestParams.tenant.schema_name)
      .findAll({
        where: { is_copy: true },
        attributes: ["title", "id", "benchmark"],
        include: [
          {
            model: Questionnaire,
            attributes: [],
            where: {
              id,
              is_copy: true,
            },
          },
          {
            model: Question,
            attributes: ["text", "id"],
            required: false,
            where: {
              max_score: 5,
              is_copy: true,
              response_type: QuestionResponseOptions.likert_scale,
            },
            include: [
              {
                model: SurveyResponse,
                as: "surveyResponses",
                where: {
                  survey_id,
                },
                include: [
                  {
                    model: Rater,
                    attributes: [
                      "category_name",
                      "is_external",
                      "short_name",
                      "name",
                    ],
                  },
                  {
                    model: QuestionResponse,
                    where: { is_copy: true },
                  },
                ],
              },
            ],
          },
        ],
      });

    let avgPerRoalGroupData = [];
    let competencyLevelData = {};

    for (const comp of data) {
      if (!comp.questions.length) {
        continue;
      }

      let currObj = {
        avg: { x: "Avg", y: 0, count: 0 },
      };
      let value = 0;
      let count = 0;
      let selfCount = 0;
      let self = 0;

      for (const question of comp.questions) {
        for (const surResp of question.surveyResponses) {
          if (surResp.rater.name !== "Self") {
            if (surResp.rater.is_external) {
              currObj["other"] = currObj["other"]
                ? {
                    ...currObj["other"],
                    y: currObj["other"].y + surResp.response.score || 0,
                    count: currObj["other"].count + 1,
                  }
                : {
                    x: "Other",
                    y: surResp.response.score || 0,
                    count: 1,
                  };
            } else {
              currObj[surResp.category_id] = currObj[surResp.category_id]
                ? {
                    ...currObj[surResp.category_id],
                    y: currObj[surResp.category_id].y + surResp.response.score,
                    count: currObj[surResp.category_id].count + 1,
                  }
                : {
                    x: surResp.rater.short_name,
                    y: surResp.response.score,
                    count: 1,
                  };
            }
            currObj["avg"] = {
              ...currObj["avg"],
              y: currObj["avg"].y + surResp.response.score,
              count: currObj["avg"].count + 1,
            };
            count++;
            value += surResp.response.score;
          } else {
            currObj[surResp.category_id] = currObj[surResp.category_id]
              ? {
                  ...currObj[surResp.category_id],
                  y: currObj[surResp.category_id].y + surResp.response.score,
                  count: currObj[surResp.category_id].count + 1,
                }
              : {
                  x: surResp.rater.short_name,
                  y: surResp.response.score,
                  count: 1,
                };
            selfCount++;
            self += surResp.response.score;
          }
        }
      }

      avgPerRoalGroupData.push({
        name: comp.title,
        data: Object.values(currObj).map((item: any) => ({
          ...item,
          y: +((item.y / item.count) as number).toFixed(1) || 0,
        })),
      });

      competencyLevelData[comp.title] = competencyLevelData[comp.title]
        ? {
            name: comp.title,
            benchmark: comp.benchmark,
            value: competencyLevelData[comp.title].value + value,
            count: competencyLevelData[comp.title].count + count,
            self: competencyLevelData[comp.title].self + self,
            selfCount: competencyLevelData[comp.title].selfCount + selfCount,
          }
        : {
            name: comp.title,
            benchmark: comp.benchmark,
            value,
            count,
            self,
            selfCount,
          };
    }

    return {
      competencyLevelData: Object.values(competencyLevelData)
        .map((item: any) => ({
          ...item,
          value: +((item.value / item.count) as number).toFixed(2),
          self: +((item.self / item.selfCount) as number).toFixed(2),
        }))
        .sort((a, b) => b.value - a.value),
      avgPerRoalGroupData,
    };
  }
}
