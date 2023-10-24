import { Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { existsSync, writeFileSync } from "fs";
import puppeteer from "puppeteer";
import { Op } from "sequelize";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { dualGapTheamConfig } from "src/common/constants/theam";
import { RequestParamsService } from "src/common/modules";

import { Competency } from "src/modules/competencies/models";
import {
  Question,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { QuestionResponseOptions } from "src/modules/competencies/modules/questions/types";
import {
  Questionnaire,
  QuestionnaireCompetency,
  QuestionnaireQuestion,
} from "src/modules/questionnaires/models";
import { Rater } from "src/modules/settings/modules/rater/models";
import {
  CompetencyComment,
  Survey,
  SurveyExternalRespondant,
  SurveyRespondant,
  SurveyResponse,
} from "src/modules/surveys/models";
import { Tenant } from "src/modules/tenants/models";
import { NewReportService } from "../newReport.service";
import { User } from "src/modules/users/models";
import { CommentResponse } from "src/modules/surveys/models/commentResponse.model";

@Injectable()
export class DualGapService {
  constructor(
    private readonly newReportService: NewReportService,
    private readonly jwtService: JwtService,
    private readonly requestParams: RequestParamsService
  ) {}

  async getReportContentNew(id: string) {
    const reportIntro = await this.newReportService.getIntorPageDetails(id);
    const questionnaire_id = JSON.parse(
      reportIntro.surveyDescription
    ).questionnaire_id;
    const { competencyData, avgGapByRaters, competencyNames } =
      await this.getCompetencyLevelRatings(id, questionnaire_id);

    const questionsData = await this.individualQuestionReport(
      id,
      questionnaire_id
    );

    const competencyCommentsData = await this.getCompetencyCommentsReport(
      id,
      questionnaire_id
    );
    const topFiveData = await this.topFiveData(id, questionnaire_id);
    const { top10Questions, questions, raters } = await this.getTop10Questions(
      id,
      questionnaire_id
    );
    const avgGapByRatersdata = JSON.parse(avgGapByRaters);

    for (const key of Object.keys(avgGapByRatersdata)) {
      const isTrueValue = avgGapByRatersdata[key].data.every(
        (element) => element === 0.0001
      );

      if (isTrueValue) {
        delete avgGapByRatersdata[key];
      }
    }
    var shiftedData = {};

    Object.keys(avgGapByRatersdata)
      .filter((key) => key !== "Avg") // Exclude "Avg" from the keys
      .forEach((key) => (shiftedData[key] = avgGapByRatersdata[key]));

    shiftedData["Avg"] = avgGapByRatersdata.Avg; // Add "Avg" to the end of the object

    return {
      reportIntro,
      tailwindConfig: JSON.stringify(dualGapTheamConfig),
      competencyDeviderData: {
        title: "competency level rating & summary",
        tenant: this.requestParams.tenant.name,
        logo_path: reportIntro.introDetail.logo_path,
        survey: JSON.parse(reportIntro.surveyDescription),
        url: `${process.env.BE_URL}/media/images/Star.svg`,
      },

      competencyData: {
        data: JSON.stringify(competencyData),
        arrayData: competencyData,
        competencyCommentsData,
        avgGapByRaters: JSON.stringify(shiftedData),
        competencyNames,
        url: `${process.env.BE_URL}/media/images/Star.svg`,
      },
      questionsData: {
        ...questionsData,
        top10Questions,
        questions: JSON.stringify(questions),
        raters: JSON.stringify(raters),
        url: `${process.env.BE_URL}/media/images/Star.svg`,
      },
      topFiveData,
    };
  }

  async getCompetencyLevelRatings(id: string, questionnaire_id: string) {
    const data = await Competency.schema(this.requestParams.schema_name)
      .unscoped()
      .findAll({
        order: [
          [
            { model: Question, as: "questions" },
            { model: QuestionnaireQuestion, as: "questionnaireQuestion" },
            // { model: Rater, as: "rater" },
            "order",
            "ASC",
          ],
          [
            { model: QuestionnaireCompetency, as: "questionnaireCompetencies" },
            "order",
            "ASC",
          ],
          [
            { model: Question, as: "questions" },
            { model: SurveyResponse, as: "surveyResponses" },
            { model: Rater, as: "rater" },
            "order",
            "ASC",
          ],
        ],
        where: { is_copy: true },
        attributes: ["id", "title", "benchmark"],
        include: [
          {
            model: Questionnaire,
            attributes: [],
            through: {
              attributes: [],
            },
            where: {
              id: questionnaire_id,
              is_copy: true,
            },
          },
          {
            model: QuestionnaireCompetency.unscoped(),
            attributes: ["order"],
            where: {
              questionnaire_id: questionnaire_id,
            },
          },
          {
            model: Question,
            attributes: ["id", "text", "avg_gap", "order"],
            where: {
              // max_score: 5,
              is_copy: true,
              response_type: QuestionResponseOptions.likert_scale,
            },
            include: [
              {
                attributes: ["gap", "id", "survey_id"],
                model: SurveyResponse,
                as: "surveyResponses",
                where: {
                  survey_id: id,
                  is_dont_know: false,
                },
                required: true,
                include: [
                  {
                    attributes: [
                      ["category_name", "name"],
                      "short_name",
                      "is_external",
                      "order",
                    ],
                    model: Rater,
                  },
                ],
              },
              {
                model: QuestionnaireQuestion.unscoped(),
                where: {
                  questionnaire_id: questionnaire_id,
                },
              },
            ],
          },
        ],
      });

    let competencies = [];
    let competencyNames = [];
    let avgGapByRaters = {};

    let sortedArray = [];
    for (const [index, competency] of data.entries()) {
      let questions = [];
      let questionsArr = [];
      let selfAvgArr = [];
      let otherAvgArr = [];
      let obj = {
        sum: 0,
        count: 0,
        selfSum: 0,
        selfCount: 0,
        othersSum: 0,
        othersCount: 0,
      };
      let raterWiseData = {
        Self: {
          count: 0,
          value: 0,
        },
        // Avg: {
        //   count: 0,
        //   value: 0,
        // },
        Other: {
          count: 0,
          value: 0,
        },
      };
      for (const question of competency.questions) {
        let questionSelfAvg = {
          sum: 0,
          count: 0,
        };
        let questionAvg = {
          sum: 0,
          count: 0,
        };

        for (const response of question.surveyResponses) {
          let gap = response.gap < 0 ? 0 : response.gap;
          obj.sum += gap;
          obj.count++;

          if (response.rater.name === "Self") {
            obj.selfSum += gap;
            obj.selfCount++;
            questionSelfAvg.sum += gap;
            questionSelfAvg.count++;
            raterWiseData["Self"] = {
              count: raterWiseData["Self"].count + 1,
              value: raterWiseData["Self"].value + gap,
            };
          } else {
            obj.othersSum += gap;
            obj.othersCount++;
            questionAvg.sum += gap;
            questionAvg.count++;
            if (response.rater.is_external) {
              raterWiseData["Other"] = {
                count: raterWiseData["Other"].count + 1,
                value: raterWiseData["Other"].value + gap,
              };
            } else if (raterWiseData[response.rater.name]) {
              raterWiseData[response.rater.name] = {
                count: raterWiseData[response.rater.name].count + 1,
                value: raterWiseData[response.rater.name].value + gap,
              };
            } else {
              raterWiseData[response.rater.name] = {
                count: 1,
                value: gap,
              };
            }
            // raterWiseData["Avg"] = {
            //   count: raterWiseData["Avg"].count + 1,
            //   value: raterWiseData["Avg"].value + gap,
            // };
          }
          ``;
        }
        questionsArr.push(question.text);
        otherAvgArr.push(question.avg_gap || 0);
        selfAvgArr.push(
          +(questionSelfAvg.sum / questionSelfAvg.count).toFixed(2)
        );
        questions.push({
          text: question.text,
          order: question.order,
          id: question.id,
          // avg_gap: +(question.avg_gap || 0).toFixed(2),
          avg_gap: +(questionAvg.sum / questionAvg.count).toFixed(2),
          question_order: question.questionnaireQuestion[0].order,
          self_avg: +(questionSelfAvg.sum / questionSelfAvg.count).toFixed(2)
            ? +(questionSelfAvg.sum / questionSelfAvg.count).toFixed(2)
            : 0,
        });
        sortedArray.push({
          text: question.text,
          id: question.id,
          competency: competency.title,
          question_order: question.questionnaireQuestion[0].order,
          competency_order: competency.questionnaireCompetencies[0].order,
        });
      }

      let raters = [];
      let data = [];
      let heatMapData = [];

      for (const [key, value] of Object.entries(raterWiseData)) {
        let val = +(value.value / value.count).toFixed(2) || 0;
        if (avgGapByRaters[key]) {
          avgGapByRaters[key].data.push(val === 0 ? 0.0001 : val);
        } else {
          avgGapByRaters[key] = {
            key,
            name: key,
            data: [val === 0 ? 0.0001 : val],
          };
        }
        heatMapData.push({
          x: key,
          y: +(value.value / value.count).toFixed(2),
        });
        data.push(+(value.value / value.count).toFixed(2));
        raters.push(key);
      }

      competencyNames.push(competency.title);
      competencies.push({
        name: competency.title,
        competency_order: competency.questionnaireCompetencies[0].order,
        data: heatMapData,
        overall_avg: competency.benchmark,
        value: +(obj.sum / obj.count).toFixed(2),
        others: +(obj.othersSum / obj.othersCount).toFixed(2),
        self: +(obj.selfSum / obj.selfCount).toFixed(2),
        raters: JSON.stringify(raters),
        questionsData: questions,
        questionsArr: JSON.stringify(questionsArr),
        otherAvgArr: JSON.stringify(otherAvgArr),
        selfAvgArr: JSON.stringify(selfAvgArr),
        questions: JSON.stringify(questions),
        raterWiseData: JSON.stringify(data),
        compIndex: index,
        url: `${process.env.BE_URL}/media/images/Star.svg`,
      });
    }

    return {
      // competencyData: competencies.sort((a, b) => b.others - a.others),
      competencyData: {
        sortedArray: JSON.parse(
          JSON.stringify(
            sortedArray.sort((a, b) => a.competency_order - b.competency_order)
          )
        ),
        competencyData: JSON.parse(
          JSON.stringify(
            competencies.sort((a, b) => a.competency_order - b.competency_order)
          )
        ),
        competencyData2: competencies.sort((a, b) => a.others - b.others),
      },
      avgGapByRaters: JSON.stringify(avgGapByRaters),
      competencyNames: JSON.stringify(competencyNames),
    };
  }

  async individualQuestionReport(id: string, questionnaire_id: string) {
    const data = JSON.parse(
      JSON.stringify(
        await Question.unscoped()
          .schema(this.requestParams.schema_name)
          .findAll({
            where: {
              is_copy: true,
              response_type: QuestionResponseOptions.likert_scale,
            },
            order: [
              // [{ model: Competency, as: "competency" }, "title", "ASC"],
              [
                { model: QuestionnaireQuestion, as: "questionnaireQuestion" },
                "order",
                "ASC",
              ],
              [
                { model: SurveyResponse, as: "surveyResponses" },
                { model: Rater, as: "rater" },
                "order",
                "ASC",
              ],
            ],
            include: [
              {
                model: Competency,
                attributes: ["title"],
                where: { is_copy: true },
                include: [
                  {
                    model: QuestionnaireCompetency,
                    where: {
                      questionnaire_id: questionnaire_id,
                      is_copy: true,
                    },
                  },
                ],
              },
              {
                model: SurveyResponse,
                as: "surveyResponses",
                attributes: ["gap", "survey_id", "actual_gap", "is_dont_know"],
                where: {
                  survey_id: id,
                  is_dont_know: false,
                },
                required: true,
                include: [
                  {
                    attributes: [
                      ["category_name", "name"],
                      "short_name",
                      "order",
                    ],
                    model: Rater,
                    required: true,
                  },
                ],
              },
              {
                model: QuestionnaireQuestion.unscoped(),
                attributes: ["order"],
                where: {
                  questionnaire_id: questionnaire_id,
                  is_copy: true,
                },
              },
            ],
          })
      )
    );

    let newData = [];
    let blindSpots = [];
    let underestimated = [];
    for (const question of data) {
      let avgObj = {
        Avg: {
          count: 0,
          sum: 0,
        },
      };
      let selfGap;
      for (const response of question.surveyResponses) {
        const short_name = response.rater.name;
        // const gap = response.gap < 0 ? 0 : response.gap;
        const gap = response.gap;

        if (response.rater.name !== "Self") {
          avgObj["Avg"] = {
            count: avgObj["Avg"].count + 1,
            sum: avgObj["Avg"].sum + gap,
          };
        } else {
          if (response.survey_id === id) {
            selfGap = gap;
          }
        }
        if (avgObj[short_name]) {
          avgObj[short_name] = {
            ...avgObj[short_name],
            count: avgObj[short_name].count + 1,
            sum: avgObj[short_name].sum + gap,
            [+response.actual_gap < 0 ? "R" : +gap]:
              (avgObj[short_name][+response.actual_gap < 0 ? "R" : +gap] || 0) +
              1,
          };
        } else {
          avgObj[short_name] = {
            count: 1,
            sum: gap,
            R: response.actual_gap < 0 ? 1 : 0,
            0: response.actual_gap === 0 ? 1 : 0,
            1: response.actual_gap === 1 ? 1 : 0,
            2: response.actual_gap === 2 ? 1 : 0,
            3: response.actual_gap === 3 ? 1 : 0,
            4: response.actual_gap === 4 ? 1 : 0,
          };
        }
      }

      let raters = [];
      let avgData = [];
      let tableData = [];

      for (const [key, value] of Object.entries(avgObj) as any) {
        raters.push(key);
        avgData.push(+(value.sum / value.count).toFixed(2));
        if (key !== "Avg") {
          tableData.push({
            rater: key,
            avg: +(value.sum / value.count).toFixed(2),
            ...value,
          });
        }
      }
      let avgGap = +(avgObj["Avg"].sum / avgObj["Avg"].count).toFixed(2);

      if (selfGap < question.avg_gap && selfGap == 0) {
        blindSpots.push({
          id: question.id,
          text: question.text,
          order: question.order,
          question_order: question.questionnaireQuestion[0].order,
          competency: question.competency,
          // avg_gap: +(question.avg_gap || 0).toFixed(2),
          avg_gap: +(avgObj["Avg"].sum / avgObj["Avg"].count).toFixed(2),
          selfGap,
          // diff: +((question.avg_gap || 0) - selfGap).toFixed(2),
          diff: +(avgGap - selfGap).toFixed(2),
        });
      }
      if (selfGap > question.avg_gap) {
        underestimated.push({
          id: question.id,
          text: question.text,
          order: question.order,
          question_order: question.questionnaireQuestion[0].order,
          competency: question.competency,
          // avg_gap: +(question.avg_gap || 0).toFixed(2),
          avg_gap: +(avgObj["Avg"].sum / avgObj["Avg"].count).toFixed(2),
          selfGap,
          // diff: +(selfGap - (question.avg_gap || 0)).toFixed(2),
          // diff: +(selfGap - avgGap).toFixed(2),
          diff: +(avgGap - selfGap).toFixed(2),
        });
      }

      newData.push({
        id: question.id,
        text: question.text,
        question_order: question.questionnaireQuestion[0].order,
        order: question.order,
        competency: question.competency,
        competency_order:
          question.competency.questionnaireCompetencies[0].order,
        avg_gap: +(avgObj.Avg.sum / avgObj.Avg.count).toFixed(2),
        raters: JSON.stringify(raters),
        data: JSON.stringify(avgData),
        tableData,
      });
    }

    return {
      individualQuestionData: JSON.parse(
        JSON.stringify(
          newData.sort((a, b) => a.competency_order - b.competency_order)
        )
      ),
      newData: JSON.parse(
        JSON.stringify(
          newData.sort((a, b) => a.competency_order - b.competency_order)
        )
      ),
      individualQuestionDataSorted: newData.sort(
        (a, b) => a.avg_gap - b.avg_gap
      ),
      blindSpots: blindSpots.sort((a, b) => b.diff - a.diff).slice(0, 5),
      underestimated: underestimated
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 5),
    };
  }

  async getCompetencyCommentsReport(id: string, questionnaire_id: string) {
    console.log(questionnaire_id);

    const data = JSON.parse(
      JSON.stringify(
        await CommentResponse.schema(this.requestParams.schema_name).findAll({
          where: {
            survey_id: id,
            response_text: {
              [Op.not]: "",
            },
          },
        })
      )
    );

    // const data = JSON.parse(
    //   JSON.stringify(
    //     await Competency.schema(this.requestParams.schema_name).findAll({
    //       where: { is_copy: true },
    //       attributes: ["title", "id"],
    //       order: [
    //         [
    //           { model: CompetencyComment, as: "comments" },
    //           {
    //             model: SurveyRespondant,
    //             as: "survey_respondent",
    //           },
    //           { model: Rater, as: "rater" },
    //           "order",
    //           "ASC",
    //         ],
    //         [
    //           { model: CompetencyComment, as: "comments" },
    //           {
    //             model: SurveyExternalRespondant,
    //             as: "survey_external_respondent",
    //           },
    //           { model: Rater, as: "rater" },
    //           "order",
    //           "ASC",
    //         ],
    //       ],
    //       include: [
    //         {
    //           model: Questionnaire,
    //           attributes: [],
    //           where: { is_copy: true, id: questionnaire_id },
    //         },
    //         {
    //           model: CompetencyComment,
    //           attributes: ["id", "comments", "survey_external_respondent_id"],
    //           where: {
    //             survey_id: id,
    //           },
    //           include: [
    //             {
    //               attributes: ["id"],
    //               model: SurveyRespondant,
    //               include: [
    //                 {
    //                   model: Rater,
    //                   attributes: [["category_name", "catName"], "order"],
    //                 },
    //               ],
    //             },
    //             {
    //               model: SurveyExternalRespondant,
    //               attributes: ["id"],
    //               include: [
    //                 {
    //                   model: Rater,
    //                   attributes: [["category_name", "catName"], "order"],
    //                 },
    //               ],
    //             },
    //           ],
    //         },
    //       ],
    //     })
    //   )
    // );

    return data;
  }

  async topFiveData(id: string, questionnaire_id: string) {
    const data = JSON.parse(
      JSON.stringify(
        await Question.unscoped()
          .schema(this.requestParams.schema_name)
          .unscoped()
          .findAll({
            order: [
              [
                { model: SurveyResponse, as: "surveyResponses" },
                { model: Rater, as: "rater" },
                "order",
                "ASC",
              ],
              [
                { model: QuestionnaireQuestion, as: "questionnaireQuestion" },
                "order",
                "ASC",
              ],
            ],
            where: {
              is_copy: true,
              response_type: QuestionResponseOptions.likert_scale,
            },
            attributes: ["text", "id", "avg_gap", "order"],
            subQuery: false,
            include: [
              {
                model: Competency.unscoped(),
                where: { is_copy: true },
                attributes: ["title"],
                include: [
                  {
                    model: QuestionnaireCompetency.unscoped(),
                    where: {
                      questionnaire_id: questionnaire_id,
                      is_copy: true,
                    },
                  },
                ],
              },
              {
                model: SurveyResponse,
                as: "surveyResponses",
                attributes: ["gap", "survey_id", "is_dont_know"],
                where: {
                  is_dont_know: false,
                },
                required: true,
                include: [
                  {
                    attributes: [
                      "category_name",
                      "name",
                      "short_name",
                      "order",
                    ],
                    model: Rater,
                    required: true,
                  },
                ],
              },
              {
                model: QuestionnaireQuestion.unscoped(),
                attributes: ["order"],

                where: {
                  questionnaire_id,
                  is_copy: true,
                },
              },
            ],
          })
      )
    );
    var colors = [
      "#FEBD2A",
      "#29AF7F",
      "#260F99",
      "#BEC8D0",
      "#8B0AA5",
      "#A0DA39",
      "#FF7F00",
      "#2C85B2",
      "#19B2FF",
      "#8F7EE5",
    ];
    const raters = JSON.parse(
      JSON.stringify(
        await Rater.schema(this.requestParams.schema_name).findAll({
          order: [["order", "ASC"]],
          where: {
            name: {
              [Op.ne]: "Self",
            },
          },
          include: {
            model: SurveyResponse,
            attributes: [],
            where: { survey_id: id, is_dont_know: false },

            required: true,
          },
        })
      )
    );

    let managerData = [];
    let raterWiseData = {};

    for (const rater of raters) {
      raterWiseData[rater.category_name] = {
        ...rater,
        data: [],
      };
    }

    for (const item of data) {
      let newObj = {
        competency: item.competency.title,
        question_order: item.questionnaireQuestion[0].order,
        competency_order: item.competency.questionnaireCompetencies[0].order,
        id: item.id,
        text: item.text,
        order: item.order,
        avg: {
          sum: 0,
          count: 0,
        },
        self: 0,
      };
      let raterObj = { Self: 0 };
      let overAllObj = {};

      for (const resp of item.surveyResponses) {
        let gap = resp.gap < 0 ? 0 : resp.gap;
        if (
          resp.rater.category_name !== "Self" &&
          !raterObj[resp.rater.category_name]
        ) {
          raterObj[resp.rater.category_name] = {
            avg: {
              sum: 0,
              count: 0,
            },
          };
          overAllObj[resp.rater.category_name] = {
            sum: 0,
            count: 0,
          };
        }

        if (resp.rater.category_name !== "Self") {
          overAllObj[resp.rater.category_name].sum += gap;
          overAllObj[resp.rater.category_name].count += 1;
        }

        if (resp.rater.category_name === "Self" && resp.survey_id === id) {
          raterObj["Self"] += gap;
        } else {
          if (resp.rater.category_name !== "Self") {
            if (resp.survey_id === id) {
              raterObj[resp.rater.category_name].avg.sum += gap;
              raterObj[resp.rater.category_name].avg.count += 1;
            }
          }
        }

        if (resp.rater.category_name === "Self" && resp.survey_id === id) {
          newObj.self += gap;
        } else {
          if (resp.rater.category_name !== "Self") {
            if (resp.survey_id === id) {
              newObj.avg.sum += gap;
              newObj.avg.count += 1;
            }
          }
        }
      }
      let raters = ["Self"];
      // ...new Set(
      //   raters.map(
      //     (item) => item.survey_external_respondent_id
      //   )
      // ),
      let raterWiseQuestionData: any = [
        { avg: raterObj["Self"], key: "Self", color: colors[0] },
      ];
      for (const [index, key] of Object.keys(raterWiseData).entries()) {
        if (raterWiseData[key].category_name == "Immediate Supervisor") {
          raterWiseQuestionData.push({
            key: raterWiseData[key].category_name,
            color: colors[1],
            avg: isNaN(
              +(raterObj[key]?.avg.sum / raterObj[key]?.avg.count).toFixed(2)
            )
              ? 0
              : +(raterObj[key]?.avg.sum / raterObj[key]?.avg.count).toFixed(2),
          });
        } else if (raterWiseData[key].category_name == "Indirect Supervisor") {
          raterWiseQuestionData.push({
            key: raterWiseData[key].category_name,
            color: colors[2],
            avg: isNaN(
              +(raterObj[key]?.avg.sum / raterObj[key]?.avg.count).toFixed(2)
            )
              ? 0
              : +(raterObj[key]?.avg.sum / raterObj[key]?.avg.count).toFixed(2),
          });
        } else if (raterWiseData[key].category_name == "Subordinates") {
          raterWiseQuestionData.push({
            key: raterWiseData[key].category_name,
            color: colors[3],
            avg: isNaN(
              +(raterObj[key]?.avg.sum / raterObj[key]?.avg.count).toFixed(2)
            )
              ? 0
              : +(raterObj[key]?.avg.sum / raterObj[key]?.avg.count).toFixed(2),
          });
        } else if (raterWiseData[key].category_name == "Peers") {
          raterWiseQuestionData.push({
            key: raterWiseData[key].category_name,
            color: colors[4],
            avg: isNaN(
              +(raterObj[key]?.avg.sum / raterObj[key]?.avg.count).toFixed(2)
            )
              ? 0
              : +(raterObj[key]?.avg.sum / raterObj[key]?.avg.count).toFixed(2),
          });
        } else {
          raterWiseQuestionData.push({
            key: raterWiseData[key].category_name,
            color: colors[index + 1],
            avg: isNaN(
              +(raterObj[key]?.avg.sum / raterObj[key]?.avg.count).toFixed(2)
            )
              ? 0
              : +(raterObj[key]?.avg.sum / raterObj[key]?.avg.count).toFixed(2),
          });
        }
        // raterWiseQuestionData.push({
        //   key: raterWiseData[key].category_name,
        //   color: colors[index],
        //   avg: +(raterObj[key]?.avg.sum / raterObj[key]?.avg.count).toFixed(2),
        // });
        if (
          !isNaN(
            +(raterObj[key]?.avg.sum / raterObj[key]?.avg.count).toFixed(2)
          )
        ) {
          raterWiseData[key].data.push({
            competency: item.competency.title,
            question_order: item.questionnaireQuestion[0].order,
            id: item.id,
            text: item.text,
            order: item.order,
            overall_avg: isNaN(
              +(overAllObj[key]?.sum / overAllObj[key]?.count).toFixed(2)
            )
              ? 0
              : +(overAllObj[key]?.sum / overAllObj[key]?.count).toFixed(2),
            avg: isNaN(
              +(raterObj[key]?.avg.sum / raterObj[key]?.avg.count).toFixed(2)
            )
              ? 0
              : +(raterObj[key]?.avg.sum / raterObj[key]?.avg.count).toFixed(2),
            self: raterObj["Self"],
            url: `${process.env.BE_URL}/media/images/Star.svg`,
          });
        }
      }

      managerData.push({
        ...newObj,
        overall_avg:
          !item.avg_gap || item.avg_gap === 0 ? 0.01 : +item.avg_gap.toFixed(2),
        avg: isNaN(+(newObj.avg.sum / newObj.avg.count).toFixed(2))
          ? 0
          : +(newObj.avg.sum / newObj.avg.count).toFixed(2),
        self: newObj.self,
        url: `${process.env.BE_URL}/media/images/Star.svg`,
        raterWiseQuestionData,
      });
    }

    let sortedtopFiveStrenghtsData = JSON.parse(
      JSON.stringify(
        managerData.sort((a, b) => a.competency_order - b.competency_order)
      )
    );

    return {
      sortedtopFiveStrenghtsData,
      topFiveStrenghtsData: managerData
        .sort((a, b) => a.avg - b.avg)
        .slice(0, 5),
      topFiveDevelopmemntNeedsData: managerData
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5),
      topFiveDevelopmemntNeedsDataSorted: managerData.sort(
        (a, b) => a.competency_order - b.competency_order
      ),
      categoryData: Object.values(raterWiseData).map(
        (item: any, index: number) => ({
          ...item,
          catIndex: index,
          data: undefined,
          topFiveStrenghtsData: item.data
            .sort((a, b) => a.avg - b.avg)
            .slice(0, 5),
          sortedtopFiveStrenghtsData,
          topFiveDevelopmemntNeedsData: item.data
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 5),
        })
      ),
      url: `${process.env.BE_URL}/media/images/Star.svg`,
    };
  }

  async getTop10Questions(id: string, questionnaire_id: string) {
    const data = JSON.parse(
      JSON.stringify(
        await Question.unscoped()
          .schema(this.requestParams.schema_name)
          .findAll({
            where: {
              is_copy: true,
              response_type: QuestionResponseOptions.likert_scale,
            },
            order: [
              [
                { model: SurveyResponse, as: "surveyResponses" },
                { model: Rater, as: "rater" },
                "order",
                "ASC",
              ],
              [
                { model: QuestionnaireQuestion, as: "questionnaireQuestion" },
                "order",
                "ASC",
              ],
            ],
            include: [
              {
                model: Competency,
                attributes: ["title"],
                where: { is_copy: true },
                include: [
                  {
                    model: QuestionnaireCompetency,
                    where: {
                      questionnaire_id: questionnaire_id,
                      is_copy: true,
                    },
                  },
                ],
              },
              {
                model: SurveyResponse,
                as: "surveyResponses",
                attributes: ["gap", "survey_id", "id"],
                where: {
                  survey_id: id,
                  is_dont_know: false,
                },
                required: true,
                include: [
                  {
                    model: QuestionResponse,
                    as: "response",
                    where: { is_copy: true },
                  },
                  {
                    model: QuestionResponse,
                    as: "expected_response",
                    foreignKey: "survey_external_respondant_id",
                    where: { is_copy: true },
                  },
                  {
                    attributes: [
                      "name",
                      "short_name",
                      "category_name",
                      "is_external",
                      "order",
                    ],
                    model: Rater,
                    required: true,
                  },
                ],
              },
              {
                model: QuestionnaireQuestion,
                attributes: ["order"],
                where: {
                  questionnaire_id: questionnaire_id,
                  is_copy: true,
                },
              },
            ],
          })
      )
    );

    let newData = {};
    let questions = [];
    let raters = [];
    for (const question of data) {
      let ratersCurrentResponses = {};
      let questionObj = {
        id: question.id,
        question_order: question.questionnaireQuestion[0].order,
        competency_order:
          question.competency.questionnaireCompetencies[0].order,
        text: question.text,
        order: question.order,
        competency: question.competency.title,
        current: 0,
        expected: 0,
        diff: 0,
        gap: 0,
      };

      for (const response of question.surveyResponses) {
        let name = response.rater.is_external
          ? "Other"
          : response.rater.category_name;
        if (!raters.includes(name)) {
          raters.push(name);
        }
        // if (response.rater.name !== "Self") {
        this.setValues(response, ratersCurrentResponses);
        // }
      }

      for (const [key, value] of Object.entries(
        ratersCurrentResponses
      ) as any) {
        // console.log(value.currentSum, "value.currentSum");
        // console.log(value.count, "value.count");
        // console.log(
        //   value.currentSum / value.count,
        //   "value.currentSum / value.count"
        // );
        questionObj[value.short_name] = {
          current: +(value?.currentSum / value?.count).toFixed(1),
          expected: +(value?.expectedSum / value?.count).toFixed(1),
        };

        questionObj.current = +(value?.currentSum / value?.count).toFixed(2);
        questionObj.expected = +(value.expectedSum / value.count).toFixed(2);
        questionObj.gap = +(value.gapSum / value.count).toFixed(2);
        questionObj.diff =
          +questionObj[value.short_name].expected -
          +questionObj[value.short_name].current;
        if (newData[key]) {
          newData[key].data.push({ ...questionObj });
        } else {
          newData[key] = {
            category: key,
            data: [{ ...questionObj }],
          };
        }
      }
      questions.push({ ...questionObj });
    }

    return {
      questions: questions.sort(
        (a, b) => a.competency_order - b.competency_order
      ),
      raters: JSON.stringify([...new Set(raters)]),
      top10Questions: Object.values(newData).map(
        (item: any, index: number) => ({
          ...item,
          catIndex: index,
          data: item.data.sort((a, b) => b.diff - a.diff).slice(0, 10),
        })
      ),
    };
  }

  setValues(response: SurveyResponse, obj: any) {
    let gap = response.gap < 0 ? 0 : response.gap;

    let catName = response.rater.is_external
      ? "Other"
      : response.rater.category_name;
    if (obj[catName]) {
      obj[catName] = {
        short_name: response.rater.is_external
          ? "Other"
          : response.rater.category_name,
        count: obj[catName].count + 1,
        gapSum: obj[catName].gapSum + gap,
        currentSum: obj[catName].currentSum + response.response.score,
        expectedSum:
          obj[catName].expectedSum + response.expected_response.score,
      };
    } else {
      obj[catName] = {
        short_name: response.rater.is_external
          ? "Other"
          : response.rater.category_name,
        count: 1,
        gapSum: gap,
        currentSum: response.response.score,
        expectedSum: response.expected_response.score,
      };
    }
  }

  async getReport(token: string) {
    const data = (await this.jwtService.decode(token)) as any;
    const tenant = await Tenant.schema(DB_PUBLIC_SCHEMA).findOne({
      where: { schema_name: data.schema_name },
    });
    if (!tenant) {
      throw new NotFoundException("Tenant not found!");
    }
    if (
      existsSync(
        `src/public/media/reports/dual-gap/report-${data.survey_id}.pdf`
      )
    ) {
      return `src/public/media/reports/dual-gap/report-${data.survey_id}.pdf`;
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
        `http://localhost:${process.env.PORT}/api/v1/reports/dual-gap/content/${data.survey_id}`,
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
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
      });

      await browser.close();

      if (pdf) {
        writeFileSync(
          `src/public/media/reports/dual-gap/report-${data.survey_id}.pdf`,
          pdf
        );
        await Survey.schema(data.schema_name).update(
          {
            report_path: `/media/reports/dual-gap/report-${data.survey_id}.pdf`,
          },
          { where: { id: data.survey_id } }
        );
        return `src/public/media/reports/dual-gap/report-${data.survey_id}.pdf`;
      }
    }
  }

  async downloadReport(survey_id: string) {
    const tenant = await Tenant.schema(DB_PUBLIC_SCHEMA).findOne({
      where: { schema_name: this.requestParams.schema_name },
    });
    const survey = await Survey.schema(this.requestParams.schema_name).findOne({
      where: {
        id: survey_id,
      },
      include: [
        {
          model: User,
        },
      ],
    });
    const updatedName = survey.employee.name.trim().replace(/ /g, "_");
    if (!tenant) {
      throw new NotFoundException("Tenant not found!");
    }
    if (existsSync(`src/public/media/reports/dual-gap/${updatedName}.pdf`)) {
      return `src/public/media/reports/dual-gap/${updatedName}.pdf`;
    } else {
      const browser = await puppeteer.launch({
        args: ["--font-render-hinting=none", "--force-color-profile=srgb"],
      });
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
      );

      let token: any = this.jwtService.sign({
        id: this.requestParams.user.id,
      });

      await page.setExtraHTTPHeaders({
        "x-tenant-name": tenant.schema_name,
        authorization: `Bearer ${token}`,
      });
      await page.goto(
        `http://localhost:${process.env.PORT}/api/v1/reports/dual-gap/content/${survey_id}`,
        {
          waitUntil: "networkidle0",
          timeout: 600000,
        }
      );

      await page.evaluateHandle("document.fonts.ready");
      await page.emulateMediaType("print");
      page.setDefaultNavigationTimeout(1000);
      const pdf = await page.pdf({
        printBackground: true,
        format: "A4",
        scale: 1.0,
        margin: {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        displayHeaderFooter: true,
        headerTemplate: ` <div
            id='header-template'
            class='border-b'
            style='font-size:10px !important;width:1319px; color:#4D4D4D; margin: -8px 27px 5px 27px;display:flex;border-bottom:0.5px solid #E0E0E0;'
          >
            <div style='text-align: left; width: 50%;padding-bottom:5px;font-size:9px;font-family:'inter'' >${survey.employee.name}</div>
            <div style='text-align: right; width: 50%;padding-bottom:5px;font-size:9px;font-family:'inter''>Private & Confidential</div>
          </div>`,
        footerTemplate: `  <div
        id='footer-template'
        class='border-b mb-5'
        style='font-size:10px !important; color:#4D4D4D; width:1319px;margin:0px 27px -8px 27px;display:flex;border-top:0.5px solid #E0E0E0; '
      >
        <div style='text-align: left; width: 50%;padding-top:5px;font-size:9px;font-family:'inter''>Copyright &copy; NBO Leadership Sdn. Bhd.</div>
        <div style='text-align: right; width: 50%;padding-top:5px;font-size:9px;font-family:'inter'' class="pageNumber"></div>
      </div>`,
      });

      await browser.close();

      if (pdf) {
        writeFileSync(
          `src/public/media/reports/dual-gap/${updatedName}.pdf`,
          pdf
        );
        await Survey.schema(this.requestParams.schema_name).update(
          {
            report_path: `/media/reports/dual-gap/${updatedName}.pdf`,
            // report_path: `/media/reports/dual-gap/${updatedName}.pdf`,
          },
          { where: { id: survey_id } }
        );
        return `src/public/media/reports/dual-gap/${updatedName}.pdf`;
      }
    }
  }
}
