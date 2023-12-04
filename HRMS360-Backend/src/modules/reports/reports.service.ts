import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/sequelize";
import { existsSync, writeFileSync } from "fs";
import { literal } from "sequelize";
import { getShortFrom, printPDF } from "src/common/helpers";
import { MailsService } from "src/common/modules/mails";

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
import puppeteer from "puppeteer";

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
      .schema(this.requestParams.schema_name)
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
      .schema(this.requestParams.schema_name)
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
      .schema(this.requestParams.schema_name)
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
      .schema(this.requestParams.schema_name)
      .findAll({
        attributes: ["category_name", "id", "is_external", "short_name"],
      });
    const data = await this.competency
      .schema(this.requestParams.schema_name)
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
      .schema(this.requestParams.schema_name)
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

        for (const surResp of resp.surver_responses) {
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
      .schema(this.requestParams.schema_name)
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
        for (const surResp of resp.surver_responses) {
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
      .schema(this.requestParams.schema_name)
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
        for (const surResp of resp.surver_responses) {
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
      .schema(this.requestParams.schema_name)
      .findAll({
        where: { is_copy: true },
        attributes: ["title", "id"],
        order: [
          [
            { model: CompetencyComment, as: "comments" },
            { model: SurveyRespondant, as: "survey_respondent" },
            { model: Rater, as: "rater" },
            "category_name",
            "DESC",
          ],
          [
            { model: CompetencyComment, as: "comments" },
            {
              model: SurveyExternalRespondant,
              as: "survey_external_respondent",
            },
            { model: Rater, as: "rater" },
            "category_name",
            "DESC",
          ],
          [
            { model: Question, as: "questions" },
            { model: SurveyResponse, as: "surveyResponses" },
            { model: Rater, as: "rater" },
            "category_name",
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
                  { model: Rater, attributes: [["category_name", "catName"]] },
                ],
              },
              {
                model: SurveyExternalRespondant,
                attributes: ["id"],
                include: [
                  { model: Rater, attributes: [["category_name", "catName"]] },
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
      .schema(this.requestParams.schema_name)
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
      .schema(this.requestParams.schema_name)
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

  async genrateReport(survey_id: string, token: any) {
    const surveys = await this.survey.schema(token.schema_name).findAll({
      where: {
        survey_id,
      },
      include: [
        {
          model: User.schema(token.schema_name),
          attributes: ["name", "email", "id"],
        },
        {
          model: SurveyDescription.schema(token.schema_name),
          attributes: ["id", "title"],
        },
      ],
    });

    for (const survey of surveys) {
      let userToken = await this.jwtService.signAsync({
        id: survey.employee_id,
      });
      let surveyToken = await this.jwtService.signAsync({
        survey_id: survey.id,
        schema_name: token.schema_name,
        token: userToken,
      });

      let Mail = {
        to: survey.employee.email,
        subject: `Survey Completion Report | ${survey.survey_description.title}`,
        context: {
          link: `${this.config.get("FE_URL")}/survey/report/${surveyToken}`,
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
    }
  }

  async getReport(survey_id: string) {
    if (existsSync(`src/public/media/reports/report-${survey_id}.pdf`)) {
      return `/media/reports/report-${survey_id}.pdf`;
    } else {
      const browser = await puppeteer.launch({
        args: ["--font-render-hinting=none", "--force-color-profile=srgb"],
      });
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
      );
      const token = await this.jwtService.sign({
        id: this.requestParams.getUser().id,
      });
      await page.setExtraHTTPHeaders({
        "x-tenant-name": this.requestParams.schema_name,
        "authorization": `Bearer ${token}`,
      });
      await page.goto(
        `http://localhost:${process.env.PORT}/api/v1/reports/single-response-report-data/${survey_id}`,
        {
          waitUntil: "networkidle0",
          timeout: 600000,
        }
      );

      await page.evaluateHandle("document.fonts.ready");
      const pdf = await page.pdf({
        printBackground: true,
        format: "A4",
        margin: {
          top: 25,
          left: 15,
          right: 15,
          bottom: 25,
        },
        displayHeaderFooter: true,
        headerTemplate: ` <div
            id='header-template'
            class='border-b'
            style='font-size:9px !important; color:#4D4D4D; width:100%;margin: 0px 15px 0px 15px;display:flex;border-bottom:1px solid #E0E0E0; text-transform:uppercase;'
          >
            <div style='text-align: left; width: 50%;padding-bottom:5px;' class='title'></div>
            <div style='text-align: right; width: 50%;padding-bottom:5px;'>Private & Confidential</div>
          </div>`,
        footerTemplate: ` <div
        id='footer-template'
        class='border-b'
        style='font-size:9px !important; color:#4D4D4D; width:100%;margin:0px 15px 0px 15px;display:flex;border-top:1px solid #E0E0E0; text-transform:uppercase;'
      >
        <div style='text-align: left; width: 50%;padding-top:5px;'>${this.requestParams.tenant.name}</div>
        <div style='text-align: right; width: 50%;padding-top:5px;' class="pageNumber"></div>
      </div>`,
      });

      await browser.close();

      if (pdf) {
        writeFileSync(`src/public/media/reports/report-${survey_id}.pdf`, pdf);
        await Survey.schema(this.requestParams.schema_name).update(
          {
            report_path: `/media/reports/report-${survey_id}.pdf`,
          },
          { where: { id: survey_id } }
        );
        return `/media/reports/report-${survey_id}.pdf`;
      }
    }
    return;
  }

  async getQuestionWiseReport(id: string, survey_id?: string) {
    // await this.sequelize.query(
    //   `set search_path to ${this.requestParams.tenant.schema_name}`
    // );
    const data = await this.questionnaire
      .schema(this.requestParams.schema_name)
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

      for (const surResp of resp.surver_responses) {
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
      for (const surResp of resp.surver_responses) {
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
      .schema(this.requestParams.schema_name)
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
