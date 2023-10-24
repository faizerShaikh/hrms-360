import { Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/sequelize";
import { existsSync, writeFileSync } from "fs";
import puppeteer from "puppeteer";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { dualGapTheamConfig } from "src/common/constants/theam";
import { RequestParamsService } from "src/common/modules";
import { Competency } from "src/modules/competencies/models";
import { Question } from "src/modules/competencies/modules/questions/models";
import { QuestionResponseOptions } from "src/modules/competencies/modules/questions/types";
import {
  Questionnaire,
  QuestionnaireCompetency,
  QuestionnaireQuestion,
} from "src/modules/questionnaires/models";
import { Rater } from "src/modules/settings/modules/rater/models";
import {
  Survey,
  SurveyDescription,
  SurveyResponse,
} from "src/modules/surveys/models";
import { Tenant } from "src/modules/tenants/models";
import { Op } from "sequelize";

@Injectable()
export class CompositReportService {
  constructor(
    @InjectModel(SurveyDescription)
    private readonly surveyDescription: typeof SurveyDescription,
    private readonly jwtService: JwtService,
    private readonly requestParams: RequestParamsService
  ) {}

  async getReportContent(id: string) {
    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          id,
        },
      });
    if (!surveyDescription) throw new NotFoundException("Survey Not Found");

    const strengthsAndDevNeedsData = await this.getStrengthsAndDevNeeds(
      surveyDescription.questionnaire_id
    );
    const competencyData = await this.getCompetencyLevelRatings(
      surveyDescription.questionnaire_id
    );
    const questionLevelReport = await this.individualQuestionReport(
      surveyDescription.questionnaire_id
    );

    return {
      tailwindConfig: JSON.stringify(dualGapTheamConfig),
      introPageData: {
        title: "Summary for 360 Leadership Survey",
        tenant: this.requestParams.tenant.name,
        logo_path: `${process.env.BE_URL}/media/images/nbol-email-logo.png`,
        survey: JSON.parse(JSON.stringify(surveyDescription)),
        url: `http://${process.env.BE_URL}/media/images/Star.png`,
      },
      strengthsAndDevNeedsData,
      competencyData,
      questionLevelReport,
    };
  }

  async getStrengthsAndDevNeeds(id) {
    let data = JSON.parse(
      JSON.stringify(
        await Question.unscoped()
          .schema(this.requestParams.schema_name)
          .unscoped()
          .findAll({
            where: {
              is_copy: true,
              response_type: QuestionResponseOptions.likert_scale,
            },
            order: [
              // ["avg_gap", "asc"],
              // [
              //   { model: SurveyResponse, as: "surveyResponses" },
              //   { model: Rater, as: "rater" },
              //   "order",
              //   "ASC",
              // ],
              [
                { model: QuestionnaireQuestion, as: "questionnaireQuestion" },
                "order",
                "ASC",
              ],
            ],
            attributes: ["text", "id", "avg_gap", "order"],
            subQuery: false,
            include: [
              {
                model: Competency,
                where: { is_copy: true },
                attributes: ["title"],
                include: [
                  {
                    model: QuestionnaireCompetency.unscoped(),
                    where: {
                      questionnaire_id: id,
                    },
                  },
                ],
              },
              {
                model: SurveyResponse,
                as: "surveyResponses",
                attributes: ["gap", "survey_id"],
                where: {
                  is_dont_know: false,
                },
                required: true,
                include: [
                  {
                    attributes: [["category_name", "name"], "short_name"],
                    model: Rater,
                    required: true,
                  },
                ],
              },
              {
                model: QuestionnaireQuestion,
                attributes: ["order"],
                where: {
                  questionnaire_id: id,
                  is_copy: true,
                },
              },
            ],
          })
      )
    );
    let newObj = [];
    for (const item of data) {
      newObj.push({
        competency: item.competency.title,
        question_order: item.questionnaireQuestion[0].order,
        competency_order: item.competency.questionnaireCompetencies[0].order,
        id: item.id,
        text: item.text,
        order: item.order,
      });
    }

    return {
      topFiveStrengths: data.sort((a, b) => a.avg_gap - b.avg_gap).slice(0, 5),
      topFiveStrengthsSorted: JSON.parse(
        JSON.stringify(
          newObj.sort((a, b) => a.competency_order - b.competency_order)
        )
      ),
      toFiveDevelopmentNeeds: data.reverse().slice(0, 5),
    };
  }

  async getCompetencyLevelRatings(questionnaire_id: string) {
    const data = await Competency.unscoped()
      .schema(this.requestParams.schema_name)
      .unscoped()
      .findAll({
        order: [
          [
            { model: Question, as: "questions" },
            // { model: SurveyResponse, as: "surveyResponses" },
            // { model: Rater, as: "rater" },
            { model: QuestionnaireQuestion, as: "questionnaireQuestion" },
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
            model: QuestionnaireCompetency.unscoped(),
            where: {
              questionnaire_id: questionnaire_id,
            },
          },
          {
            model: Questionnaire,
            // attributes: [],
            through: {
              attributes: [],
            },
            where: {
              id: questionnaire_id,
              is_copy: true,
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
                model: QuestionnaireQuestion,
                where: {
                  questionnaire_id: questionnaire_id,
                  is_copy: true,
                },
              },
            ],
          },
        ],
      });

    let competencies = [];
    let sortedArray = [];
    let competencyNames = [];
    let avgGapByRaters = {};

    for (const [index, competency] of data.entries()) {
      // competencyNames.push(competency.title);
      competencyNames.push(competency.title);
      let avgObj = {
        avg: {
          count: 0,
          sum: 0,
        },
      };
      let raterWiseData = {
        Self: {
          count: 0,
          value: 0,
        },
        Other: {
          count: 0,
          value: 0,
        },
      };

      for (const question of competency.questions) {
        sortedArray.push({
          text: question.text,
          id: question.id,
          competency: competency.title,
          question_order: question.questionnaireQuestion[0].order,
          competency_order: competency.questionnaireCompetencies[0].order,
        });
        for (const response of question.surveyResponses) {
          let gap = response.gap < 0 ? 0 : response.gap;

          if (response.rater.name === "Self") {
            raterWiseData["Self"] = {
              count: raterWiseData["Self"].count + 1,
              value: raterWiseData["Self"].value + gap,
            };
          } else {
            avgObj.avg.count++;
            avgObj.avg.sum += gap;
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
          }
        }
      }

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
      }
      for (const key of Object.keys(avgGapByRaters)) {
        const isTrueValue = avgGapByRaters[key].data.every(
          (element) => element === 0.0001
        );

        if (isTrueValue) {
          delete avgGapByRaters[key];
        }
      }

      competencies.push({
        name: competency.title,
        competency_order: competency.questionnaireCompetencies[0].order,
        compIndex: index,
        avg_gap: +(avgObj.avg.sum / avgObj.avg.count).toFixed(2),
        questions: competency.questions,
      });
    }

    return {
      competencyInSurveySequence: JSON.parse(JSON.stringify(competencies)).sort(
        (a, b) => {
          if (a.competency_order < b.competency_order) {
            return -1;
          }

          return 0;
        }
      ),
      competencyData: {
        sortedArray: JSON.parse(
          JSON.stringify(
            sortedArray.sort((a, b) => a.competency_order - b.competency_order)
          )
        ),
        competencyData: JSON.parse(
          JSON.stringify(competencies.sort((a, b) => a.avg_gap - b.avg_gap))
        ),
        competencyData2: JSON.parse(
          JSON.stringify(
            competencies.sort((a, b) => a.competency_order - b.competency_order)
          )
        ),
      },
      avgGapByRaters: JSON.stringify(avgGapByRaters),
      competencyNames: JSON.stringify(competencyNames),
      url: process.env.BE_URL,
    };
  }

  async individualQuestionReport(questionnaire_id: string) {
    const data = JSON.parse(
      JSON.stringify(
        await Question.schema(this.requestParams.schema_name)
          .unscoped()
          .findAll({
            where: {
              is_copy: true,
              response_type: QuestionResponseOptions.likert_scale,
            },
            order: [
              [
                { model: QuestionnaireQuestion, as: "questionnaireQuestion" },
                "order",
                "ASC",
              ],
              // [{ model: Competency, as: "competency" }, "title", "ASC"],
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
      for (const response of question.surveyResponses) {
        const name = response.rater.name;

        const gap = response.gap;

        if (response.rater.name !== "Self") {
          avgObj["Avg"] = {
            count: avgObj["Avg"].count + 1,
            sum: avgObj["Avg"].sum + gap,
          };
        }
        if (avgObj[name]) {
          avgObj[name] = {
            ...avgObj[name],
            count: avgObj[name].count + 1,
            sum: avgObj[name].sum + gap,
            [+response.actual_gap < 0 ? "R" : gap]:
              (avgObj[name][+response.actual_gap < 0 ? "R" : gap] || 0) + 1,
          };
        } else {
          avgObj[name] = {
            count: 1,
            sum: gap,
            R: +response.actual_gap < 0 ? 1 : 0,
            0: +response.actual_gap === 0 ? 1 : 0,
            1: +response.actual_gap === 1 ? 1 : 0,
            2: +response.actual_gap === 2 ? 1 : 0,
            3: +response.actual_gap === 3 ? 1 : 0,
            4: +response.actual_gap === 4 ? 1 : 0,
          };
          // if (
          //   question.text ===
          //   "Examine issues and ideas, considering multiple scenarios and their’ pros and con in decision-making."
          // ) {
          //   if (name === "Immediate Supervisor") {
          //     console.log(avgObj[name]);
          //   }
          // }
        }
      }
      if (
        question.text ==
        "Leverage on own and others’ relevant experience and insights to make decisions."
      ) {
        // console.log(avgObj, "\n\n\n\n\n\n\n\n");
        // console.log(avgObj[name], "\n");
      }

      let raters = [];
      let avgData = [];
      let tableData = [];
      if (
        question.text ===
        "Examine issues and ideas, considering multiple scenarios and their’ pros and con in decision-making."
      ) {
        // console.log(avgObj);
      }
      for (const [key, value] of Object.entries(avgObj) as any) {
        raters.push(key);
        avgData.push(+(value.sum / value.count).toFixed(2));
        if (key !== "Avg") {
          let obj = {
            rater: key,
            avg: +(value.sum / value.count).toFixed(2),
            ...value,
          };

          for (const [score, count] of Object.entries(value)) {
            obj[score] = ((count as number) / value.count) * 100;
          }
          tableData.push(obj);
        }
      }

      newData.push({
        id: question.id,
        text: question.text,
        order: question.order,
        competency: question.competency,
        competency_order:
          question.competency.questionnaireCompetencies[0].order,
        question_order: question.questionnaireQuestion[0].order,
        avg_gap: (question.avg_gap || 0).toFixed(2),
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
      individualQuestionDataSorted: newData.sort(
        (a, b) => a.avg_gap - b.avg_gap
      ),
      blindSpots: blindSpots.sort((a, b) => a.diff - b.diff).slice(0, 5),
      underestimated: underestimated
        .sort((a, b) => b.diff - a.diff)
        .slice(0, 5),
    };
  }

  async getCompositReport(token: string) {
    const data = (await this.jwtService.decode(token)) as any;
    const tenant = await Tenant.schema(DB_PUBLIC_SCHEMA).findOne({
      where: { schema_name: data.schema_name },
    });
    if (!tenant) {
      throw new NotFoundException("Tenant not found!");
    }
    if (
      existsSync(
        `src/public/media/reports/composit/report-${data.survey_id}.pdf`
      )
    ) {
      return `src/public/media/reports/composit/report-${data.survey_id}.pdf`;
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
        `http://localhost:${process.env.PORT}/api/v1/reports/dual-gap/composit-content/${data.survey_id}`,
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
        displayHeaderFooter: true,
      });

      await browser.close();

      if (pdf) {
        writeFileSync(
          `src/public/media/reports/composit/report-${data.survey_id}.pdf`,
          pdf
        );

        return `src/public/media/reports/composit/report-${data.survey_id}.pdf`;
      }
    }
  }

  async downloadReport(id: string) {
    const tenant = this.requestParams.tenant;
    if (existsSync(`src/public/media/reports/composit/report-${id}.pdf`)) {
      return `src/public/media/reports/composit/report-${id}.pdf`;
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
        `http://localhost:${process.env.PORT}/api/v1/reports/dual-gap/composit-content/${id}`,
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
        displayHeaderFooter: true,
        headerTemplate: ` <div
            id='header-template'
            class='border-b'
            style='font-size:10px !important;width:1319px; color:#4D4D4D; margin: -8px 27px 5px 27px;display:flex;border-bottom:0.5px solid #E0E0E0;'
          >
            <div style='text-align: left; width: 50%;padding-bottom:5px;font-size:9px' ></div>
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
          `src/public/media/reports/composit/report-${id}.pdf`,
          pdf
        );

        return `src/public/media/reports/composit/report-${id}.pdf`;
      }
    }
  }
}
