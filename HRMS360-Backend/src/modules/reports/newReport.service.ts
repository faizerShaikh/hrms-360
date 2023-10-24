import { Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { existsSync, writeFileSync } from "fs";
import * as moment from "moment";
import { Competency } from "../competencies/models";
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
import puppeteer from "puppeteer";
import {
  Question,
  QuestionResponse,
} from "../competencies/modules/questions/models";
import { QuestionResponseOptions } from "../competencies/modules/questions/types";
import { getShortFrom } from "src/common/helpers";
import { singleGapTheamConfig } from "src/common/constants/theam";
import { Tenant } from "../tenants/models";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { RequestParamsService } from "src/common/modules";

@Injectable()
export class NewReportService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly requestParam: RequestParamsService
  ) {}

  async getSingleResponseReport(token: string) {
    const data = (await this.jwtService.decode(token)) as any;

    if (existsSync(`src/public/media/reports/report-${data.survey_id}.pdf`)) {
      return `src/public/media/reports/report-${data.survey_id}.pdf`;
    } else {
      const browser = await puppeteer.launch({
        args: ["--font-render-hinting=none", "--force-color-profile=srgb"],
      });
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
      );

      await page.setExtraHTTPHeaders({
        "x-tenant-name": data.schema_name,
        authorization: `Bearer ${data.token}`,
      });
      await page.goto(
        `http://localhost:${process.env.PORT}/api/v1/reports/single-response-report-data/${data.survey_id}`,
        {
          waitUntil: "networkidle0",
          timeout: 600000,
        }
      );

      let height = await page.evaluate(
        () => document.documentElement.offsetHeight
      );

      await page.evaluateHandle("document.fonts.ready");
      const pdf = await page.pdf({
        printBackground: true,
        format: "A4",
        // preferCSSPageSize: true,
        // height: height + 5 + "px",
      });

      await browser.close();

      if (pdf) {
        writeFileSync(
          `src/public/media/reports/report-${data.survey_id}.pdf`,
          pdf
        );
        await Survey.schema(data.schema_name).update(
          {
            report_path: `/media/reports/report-${data.survey_id}.pdf`,
          },
          { where: { id: data.survey_id } }
        );
        return `src/public/media/reports/report-${data.survey_id}.pdf`;
      }
    }

    return;
  }

  async getSingleResponseReportData(id: string) {
    const reportIntro = await this.getIntorPageDetails(id);

    const questionnaire_id = JSON.parse(
      reportIntro.surveyDescription
    ).questionnaire_id;
    const { newCompetencyLevelData, avgPerRoalGroupData } =
      await this.getCompetencyLevelReport(id, questionnaire_id);

    const { singleChoice, multipleChoice, likertScale, raters } =
      await this.getQuestionLevelReport(id, questionnaire_id);

    const commentsData = JSON.parse(
      JSON.stringify(
        await Competency.schema(this.requestParam.schema_name).findAll({
          where: { is_copy: true },
          attributes: ["title", "id"],
          order: [
            [
              { model: CompetencyComment, as: "comments" },
              {
                model: SurveyRespondant,
                as: "survey_respondent",
              },
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
              {
                model: SurveyResponse,
                as: "surveyResponses",
              },
              { model: Rater, as: "rater" },
              "order",
              "DESC",
            ],
          ],
          include: [
            {
              model: Questionnaire,
              attributes: [],
              where: { is_copy: true, id: questionnaire_id },
            },
            {
              model: CompetencyComment,
              attributes: ["id", "comments", "survey_external_respondent_id"],
              where: {
                survey_id: id,
              },
              include: [
                {
                  attributes: ["id"],
                  model: SurveyRespondant,
                  include: [
                    {
                      model: Rater,
                      attributes: [["order", "catName"]],
                    },
                  ],
                },
                {
                  model: SurveyExternalRespondant,
                  attributes: ["id"],
                  include: [
                    {
                      model: Rater,
                      attributes: [["order", "catName"]],
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
                  model: SurveyResponse,
                  as: "surveyResponses",
                  required: false,
                  attributes: ["id", "response_text"],
                  where: {
                    survey_id: id,
                    response_id: null,
                  },
                  include: [
                    {
                      model: Rater,
                      attributes: ["order", "short_name"],
                    },
                  ],
                },
              ],
            },
          ],
        })
      )
    );

    return {
      reportIntro,
      competencyDeviderData: { title: "competency level rating & summary" },
      questionDeviderData: { title: "rating at question level" },
      competencyLevelData: JSON.stringify(newCompetencyLevelData.competencies),
      avgPerRoalGroupData: JSON.stringify(avgPerRoalGroupData),
      benchmarkData: newCompetencyLevelData,
      tailwindConfig: JSON.stringify(singleGapTheamConfig),
      questionsData: {
        singleChoice,
        multipleChoice,
        likertScale,
        comments: commentsData,
        categories: [...new Set(raters)],
        raters: [...new Set(raters)].reduce(
          (prev, curr) =>
            `${prev}<td class="text-[#242424] text-center w-[80px] text-[10px] py-[3px] bg-[#EFEFEF]">${curr}</td>`,
          ""
        ),
      },
    };
  }

  async getIntorPageDetails(id: string): Promise<any> {
    const tenant = await Tenant.schema(DB_PUBLIC_SCHEMA).findOne({
      where: {
        schema_name: this.requestParam.tenant.schema_name,
      },
    });

    if (!tenant) throw new NotFoundException("Tenant not found");

    const surveyDescription = await SurveyDescription.schema(
      this.requestParam.schema_name
    ).findOne({
      include: [
        {
          model: Survey,
          where: { id },
          required: true,
          include: [
            {
              model: User,
            },
          ],
        },
      ],
    });

    const introDetail = JSON.parse(
      JSON.stringify(
        await User.schema(this.requestParam.schema_name).findOne({
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
        })
      )
    );

    if (!introDetail) throw new NotFoundException("User Not Found!");

    return {
      introDetail: {
        logo_path: `${process.env.BE_URL}/media/images/nbol-email-logo.png`,
        ...introDetail,
        surveyRespondants: introDetail.surveys[0]
          ? introDetail.surveys[0].survey_respondants
          : [],
        surveyExternalRespondants: introDetail.surveys[0]
          ? introDetail.surveys[0].survey_external_respondants
          : [],
      },
      surveyDescription: JSON.stringify(surveyDescription),
      genratedAt: moment(new Date()).format("llll"),
    };
  }

  async getCompetencyLevelReport(id: string, questionnaire_id: string) {
    const data = await Competency.schema(this.requestParam.schema_name).findAll(
      {
        where: { is_copy: true },
        attributes: ["title", "id", "benchmark"],
        include: [
          {
            model: Questionnaire,
            attributes: [],
            where: {
              id: questionnaire_id,
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
                  survey_id: id,
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
                    as: "response",
                    where: { is_copy: true },
                  },
                ],
              },
            ],
          },
        ],
      }
    );

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

    const newCompetencyLevelData = this.getFilterdCompetencies(
      Object.values(competencyLevelData)
    );

    return { newCompetencyLevelData, avgPerRoalGroupData };
  }

  async getQuestionLevelReport(id: string, questionnaire_id: string) {
    const questionsData = JSON.parse(
      JSON.stringify(
        await Questionnaire.schema(this.requestParam.schema_name).findOne({
          where: {
            id: questionnaire_id,
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
                        survey_id: id,
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
        })
      )
    );

    let raters = [];
    let singleChoice = [];
    let likertScale = [];
    let multipleChoice = [];

    for (const question of questionsData.questions) {
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
      raters,
    };
  }

  getFilterdCompetencies = (data: any) => {
    let competencies = [];
    let genrals = [
      {
        name: "Self Rating",
        data: [],
      },
      {
        name: "Job Holder Avg",
        data: [],
      },
    ];
    let hiddens = [
      {
        name: "Self Rating",
        data: [],
      },
      {
        name: "Job Holder Avg",
        data: [],
      },
    ];
    let developments = [
      {
        name: "Self Rating",
        data: [],
      },
      {
        name: "Job Holder Avg",
        data: [],
      },
    ];
    let blindspots = [
      {
        name: "Self Rating",
        data: [],
      },
      {
        name: "Job Holder Avg",
        data: [],
      },
    ];

    for (const comp of data) {
      let self = +((comp.self / comp.selfCount) as number).toFixed(2);
      let value = +((comp.value / comp.count) as number).toFixed(2);
      competencies.push({ ...comp, value, self });
      if (value >= comp.benchmark) {
        if (self >= comp.benchmark) {
          genrals[0].data.push({
            y: self,
            x: comp.name,
            goals: [
              {
                name: "Benchmark",
                value: comp.benchmark,
                strokeWidth: 2,
                strokeHeight: 12,
                strokeColor: "#E51932",
              },
            ],
          });
          genrals[1].data.push({
            y: value,
            x: comp.name,
            goals: [
              {
                name: "Benchmark",
                value: comp.benchmark,
                strokeWidth: 2,
                strokeHeight: 12,
                strokeColor: "#E51932",
              },
            ],
          });
        } else {
          hiddens[0].data.push({
            y: self,
            x: comp.name,
            goals: [
              {
                name: "Benchmark",
                value: comp.benchmark,
                strokeWidth: 2,
                strokeHeight: 12,
                strokeColor: "#E51932",
              },
            ],
          });
          hiddens[1].data.push({
            y: value,
            x: comp.name,
            goals: [
              {
                name: "Benchmark",
                value: comp.benchmark,
                strokeWidth: 2,
                strokeHeight: 12,
                strokeColor: "#E51932",
              },
            ],
          });
        }
      } else if (value < comp.benchmark) {
        if (self >= comp.benchmark) {
          blindspots[0].data.push({
            y: self,
            x: comp.name,
            goals: [
              {
                name: "Benchmark",
                value: comp.benchmark,
                strokeWidth: 2,
                strokeHeight: 12,
                strokeColor: "#E51932",
              },
            ],
          });
          blindspots[1].data.push({
            y: value,
            x: comp.name,
            goals: [
              {
                name: "Benchmark",
                value: comp.benchmark,
                strokeWidth: 2,
                strokeHeight: 12,
                strokeColor: "#E51932",
              },
            ],
          });
        } else {
          developments[0].data.push({
            y: self,
            x: comp.name,
            goals: [
              {
                name: "Benchmark",
                value: comp.benchmark,
                strokeWidth: 2,
                strokeHeight: 12,
                strokeColor: "#E51932",
              },
            ],
          });
          developments[1].data.push({
            y: value,
            x: comp.name,
            goals: [
              {
                name: "Benchmark",
                value: comp.benchmark,
                strokeWidth: 2,
                strokeHeight: 12,
                strokeColor: "#E51932",
              },
            ],
          });
        }
      }
    }
    return {
      genralData: JSON.stringify(genrals),
      hiddenData: JSON.stringify(hiddens),
      developmentData: JSON.stringify(developments),
      blindspotData: JSON.stringify(blindspots),
      competencies: competencies.sort((a, b) => b.value - a.value),
    };
  };

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
          roleDataObj["Avg"] = roleDataObj["Avg"]
            ? {
                count: roleDataObj["Avg"].count + 1,
                score: roleDataObj["Avg"].score + resp.score,
              }
            : {
                count: 1,
                score: resp.score,
              };
          raters.push("Avg");
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
      names: names,
      scores: scores,
      names1: JSON.stringify(names),
      scores1: JSON.stringify(scores),
      responses: responses,
      competency: question.competency,
    });
  }

  async getChoiceData(question: Question, array: any[], raters: string[]) {
    let responses = [];
    let chartData = {};
    let names = [];
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
            if (!names.includes(surResp.rater.short_name)) {
              names.push(shortName);
            }
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
        name: resp.label,
        data: names.map((name) => dataCountObj[name] || 0),
        ...dataCountObj,
      });
    }

    array.push({
      id: question.id,
      text: question.text,
      responses: responses,
      responses1: JSON.stringify(responses),
      response_type: question.response_type,
      chartData: Object.values(chartData),
      competency: question.competency,
      names: JSON.stringify(names),
    });
  }
}
