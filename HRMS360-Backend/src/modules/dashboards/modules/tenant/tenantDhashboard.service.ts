import { Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import * as moment from "moment";
import { col, fn, literal, Op, Sequelize } from "sequelize";
import { RequestParamsService } from "src/common/modules";
import { Competency } from "src/modules/competencies/models";
import { CompetencyTypeOptions } from "src/modules/competencies/types";
import { Questionnaire } from "src/modules/questionnaires/models";
import { SurveyDescription } from "src/modules/surveys/models";
import { SurveyDescriptionStatus } from "src/modules/surveys/type";
import { User } from "src/modules/users/models";

@Injectable()
export class TenantDhashboardService {
  constructor(
    @InjectModel(SurveyDescription)
    private readonly surveyDescription: typeof SurveyDescription,
    @InjectModel(User)
    private readonly user: typeof User,
    @InjectModel(Competency)
    private readonly competency: typeof Competency,
    @InjectModel(Questionnaire)
    private readonly questionnaire: typeof Questionnaire,
    @InjectConnection() private readonly sequelize: Sequelize,
    private requestParams: RequestParamsService
  ) {}

  async getAllSurveyCount() {
    const totalGet = this.surveyDescription
      .schema(this.requestParams.schema_name)
      .count();
    const lastYearCountGet = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .count({
        where: {
          createdAt: {
            [Op.gt]: literal("current_timestamp - interval '2 year'"),
          },
        },
        group: [fn("date_trunc", "year", col("createdAt"))],
      });

    const [total, lastYearCount] = await Promise.all([
      totalGet,
      lastYearCountGet,
    ]);

    const currentYear =
      lastYearCount.find(
        (item) =>
          moment(item.date_trunc).format("YYYY") === moment().format("YYYY")
      )?.count || 0;
    const lastYear =
      lastYearCount.find(
        (item) =>
          moment(item.date_trunc).format("YYYY") ===
          moment().subtract(1, "year").format("YYYY")
      )?.count || 0;

    return {
      total,
      lastYearCount: ((currentYear - lastYear) / lastYear) * 100,
    };
  }

  async getAllEmployeeCount() {
    const totalGet = this.user.schema(this.requestParams.schema_name).count();
    const thisWeekCountGet = await this.user
      .schema(this.requestParams.schema_name)
      .count({
        where: {
          createdAt: {
            [Op.gte]: literal(`date_trunc('week', now())`),
          },
        },
      });

    const [total, thisWeekCount] = await Promise.all([
      totalGet,
      thisWeekCountGet,
    ]);

    return {
      total,
      thisWeekCount,
    };
  }

  async getAllCompetencyCount() {
    const totalGet = this.competency
      .schema(this.requestParams.schema_name)
      .count({
        where: {
          type: CompetencyTypeOptions.custom,
        },
      });
    const thisWeekCountGet = await this.competency
      .schema(this.requestParams.schema_name)
      .count({
        where: {
          type: CompetencyTypeOptions.custom,
          createdAt: {
            [Op.gte]: literal(`date_trunc('week', now())`),
          },
        },
      });

    const [total, thisWeekCount] = await Promise.all([
      totalGet,
      thisWeekCountGet,
    ]);

    return {
      total,
      thisWeekCount,
    };
  }

  async getAllQuestionnaireCount() {
    const totalGet = this.questionnaire
      .schema(this.requestParams.schema_name)
      .count({});
    const thisWeekCountGet = await this.questionnaire
      .schema(this.requestParams.schema_name)
      .count({
        where: {
          createdAt: {
            [Op.gte]: literal(`date_trunc('week', now())`),
          },
        },
      });

    const [total, thisWeekCount] = await Promise.all([
      totalGet,
      thisWeekCountGet,
    ]);

    return {
      total,
      thisWeekCount,
    };
  }

  async surveyTrend(range: string) {
    let interval = {
      by_week: {
        arg: 1,
        sub_value: 7,
        format: "YYYY-MM-DD",
        type: "week",
        by: "day",
        sub_type: "week",
      },
      by_month: {
        arg: 30,
        format: "YYYY-MM",
        sub_value: 30,
        type: "day",
        by: "day",
        sub_type: "month",
      },
      by_year: {
        arg: 1,
        format: "YYYY",
        sub_value: 12,
        type: "year",
        by: "month",
        sub_type: "year",
      },
    };

    const surveyCount: any = await this.sequelize.query(
      `select date_trunc('${interval[range].by}', "createdAt")::date AS created_at, count(t.id) as "count" from ${this.requestParams.schema_name}.survey_descriptions t where t."createdAt" > current_timestamp - interval '${interval[range].arg} ${interval[range].type}' group by date_trunc('${interval[range].by}', "createdAt");
     `
    );

    const lastCount = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .count({
        where: {
          createdAt: {
            [Op.gte]: literal(
              `current_timestamp - interval '2 ${interval[range].sub_type}'`
            ),
          },
        },
        group: [
          fn("date_trunc", `${interval[range].sub_type}`, col("createdAt")),
        ],
      });

    let current: number | null;
    let last: number | null;
    if (range == "by_week") {
      current =
        lastCount.find(
          (item) =>
            moment(item.date_trunc).format("YYYY-MM-DD") ===
            moment().day("Monday").format("YYYY-MM-DD")
        )?.count || 0;
      last =
        lastCount.find(
          (item) =>
            moment(item.date_trunc).format("YYYY-MM-DD") ===
            moment().day("Monday").subtract(1, "week").format("YYYY-MM-DD")
        )?.count || 0;
    } else {
      current =
        lastCount.find(
          (item) =>
            moment(item.date_trunc).format(interval[range].format) ===
            moment().format(interval[range].format)
        )?.count || 0;

      last =
        lastCount.find(
          (item) =>
            moment(item.date_trunc).format(interval[range].format) ===
            moment()
              .subtract(1, interval[range].sub_type)
              .format(interval[range].format)
        )?.count || 0;
    }

    let lastDate = moment(new Date()).subtract(
      interval[range].sub_value,
      interval[range].by
    );

    let dataObj = {
      [lastDate.format(interval[range].format)]: 0,
    };

    for (let index = 0; index < interval[range].sub_value; index++) {
      let newDate = lastDate
        .add(1, interval[range].by)
        .format(interval[range].format);
      dataObj[newDate] = 0;
    }

    for (const item of surveyCount[0]) {
      dataObj[moment(item.created_at).format(interval[range].format)] =
        +item.count;
    }

    let sumValue = 0;
    let categories = [];
    let data = [];
    for (const [key, value] of Object.entries(dataObj)) {
      sumValue += value;
      categories.push(key);
      data.push(value);
    }

    let calc =
      ((current - last) / last) * 100 !== Infinity &&
      ((current - last) / last) * 100 !== null
        ? ((current - last) / last) * 100
        : 100;

    const percentage = current == last ? (calc = 0) : calc;
    last = last == 0 && current != 0 ? -1 : last;

    return {
      data: data || [],
      categories: categories || [],
      total: sumValue,
      percentage,
      current,
      last,
    };
  }

  async surveyStatus(range: string) {
    let interval = {
      by_week: {
        arg: 1,
        sub_value: 7,
        format: "YYYY-MM-DD",
        type: "week",
        by: "day",
        sub_type: "week",
      },
      by_month: {
        arg: 30,
        format: "YYYY-MM-DD",
        sub_value: 30,
        type: "day",
        by: "day",
        sub_type: "month",
      },
      by_year: {
        arg: 1,
        format: "YYYY-MM",
        sub_value: 12,
        type: "year",
        by: "month",
        sub_type: "year",
      },
    };

    const currentDate = moment(new Date()).add(1, "day").format("YYYY/MM/DD");
    const endDate = moment(new Date())
      .subtract(interval[range].sub_value, interval[range].by)
      .format("YYYY/MM/DD");
    const surveyStatusGet = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .unscoped()
      .count({
        attributes: [
          ["status", "name"],
          [fn("count", col("id")), "value"],
        ],
        group: ["name"],
        where: {
          createdAt: {
            [Op.between]: [fn("date", endDate), fn("date", currentDate)],
          },
        },
      });

    const thisWeekCountGet = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .count({
        where: {
          status: SurveyDescriptionStatus.Completed,
          createdAt: {
            [Op.gte]: literal(
              `date_trunc('${interval[range].sub_type}', now())`
            ),
          },
        },
      });

    const [surveyStatus, thisWeekCount] = await Promise.all([
      surveyStatusGet,
      thisWeekCountGet,
    ]);

    return {
      surveyStatus,
      thisWeekCount,
    };
  }

  async assessmentCompletion(id: string) {
    const data = await this.sequelize.query(
      `select count(distinct(temp_data.id)),date(temp_data."response_date") as response_date from ((select date("SurveyRespondant"."response_date") as response_date, "SurveyRespondant"."id" as id from "${this.requestParams.schema_name}"."survey_respondants" as "SurveyRespondant" inner join "${this.requestParams.schema_name}"."surveys" as "survey" on "SurveyRespondant"."survey_id" = "survey"."id" and "survey"."survey_id" = '${id}' where "SurveyRespondant"."status" = 'Completed')  union (select date("SurveyExternalRespondant"."response_date") as response_date, "SurveyExternalRespondant"."id" as id from "${this.requestParams.schema_name}"."survey_external_respondants"  as "SurveyExternalRespondant" inner join "${this.requestParams.schema_name}"."surveys" as "survey" on "SurveyExternalRespondant"."survey_id" = "survey"."id" and "survey"."survey_id" = '${id}' where "SurveyExternalRespondant"."status" = 'Completed')) as temp_data group by date(temp_data."response_date")`
    );
    return data[0];
  }

  async getAllDashboardData() {
    let data = {};

    data["surveyData"] = await this.getAllSurveyCount();
    data["employeeData"] = await this.getAllEmployeeCount();
    data["competencyData"] = await this.getAllCompetencyCount();
    data["questionnaireData"] = await this.getAllQuestionnaireCount();

    return data;
  }

  async surveyTable() {
    const surveyTable = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findAll();
    return {
      data: surveyTable,
    };
  }
}
