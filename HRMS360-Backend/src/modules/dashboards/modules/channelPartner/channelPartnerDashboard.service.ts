import { Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import * as moment from "moment";
import { col, fn, literal, Op, Sequelize } from "sequelize";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { getSearchObject } from "src/common/helpers";
import { RequestParamsService } from "src/common/modules";
import { Industry } from "src/modules/settings/modules/industry/models";
import { SurveyDescription } from "src/modules/surveys/models";
import { Tenant, TenantHistory } from "src/modules/tenants/models";
import {
  TenantHistoryGroup,
  TenantHistoryTypes,
} from "src/modules/tenants/types";

@Injectable()
export class ChannelPartnerDashboardService {
  constructor(
    @InjectModel(SurveyDescription)
    private readonly surveyDescription: typeof SurveyDescription,
    @InjectModel(TenantHistory) private tenantHistory: typeof TenantHistory,
    @InjectModel(Tenant) private tenant: typeof Tenant,
    @InjectModel(Industry) private industry: typeof Industry,
    @InjectConnection() private readonly sequelize: Sequelize,
    private requestParams: RequestParamsService
  ) {}

  async dashboardCP() {
    const tenants = await this.tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      attributes: ["id"],
      where: { parent_tenant_id: this.requestParams.tenant.id },
    });

    let tenantsArr = [`'${this.requestParams.tenant.id}'`];
    for (let tenant of tenants) {
      tenantsArr.push(tenant.id);
    }

    const tenantHistorys = await this.tenantHistory
      .schema(DB_PUBLIC_SCHEMA)
      .findAll({
        attributes: ["type", [fn("count", col("id")), "count"]],
        group: "type",
        where: {
          tenant_id: [...tenantsArr],
        },
      });

    const activeTenants = await this.tenant.schema(DB_PUBLIC_SCHEMA).count({
      where: {
        [Op.and]: [
          { is_active: true },
          { parent_tenant_id: this.requestParams.tenant.id },
        ],
      },
    });
    const tenantsCount = await this.tenant.schema(DB_PUBLIC_SCHEMA).count({
      where: {
        [Op.and]: [
          { is_channel_partner: false },
          { parent_tenant_id: this.requestParams.tenant.id },
        ],
      },
    });

    const tenantHistoryArr = [tenantHistorys];
    const data = {
      ...tenantHistoryArr,
      activeTenants,
      tenantsCount,
    };

    return data;
  }

  async totalTenants(range: string) {
    let interval = {
      by_week: {
        arg: 1,
        sub_value: 7,
        format: "YYYY-MM-DD",
        type: "week",
        by: "day",
        sub_type: "week",
        sub_format: "YYYY-MM-DD",
      },
      by_month: {
        arg: 30,
        format: "YYYY-MM-DD",
        sub_value: 30,
        type: "day",
        by: "day",
        sub_type: "month",
        sub_format: "YYYY-MM",
      },
      by_year: {
        arg: 1,
        format: "YYYY-MM",
        sub_value: 12,
        type: "year",
        by: "month",
        sub_type: "year",
        sub_format: "YYYY",
      },
    };

    const tenantsCount: any = await this.sequelize.query(
      `select date_trunc('${interval[range].by}', "createdAt")::date AS created_at, count(t.id) as "count" from ${DB_PUBLIC_SCHEMA}.tenants t where t."createdAt" > current_timestamp - interval '${interval[range].arg} ${interval[range].type}' and t."is_channel_partner" = false and t."parent_tenant_id" = '${this.requestParams.tenant.id}' group by date_trunc('${interval[range].by}', "createdAt");
     `
    );

    const lastCount = await this.tenant.schema(DB_PUBLIC_SCHEMA).count({
      where: {
        createdAt: {
          [Op.gte]: literal(
            `current_timestamp - interval '2 ${interval[range].sub_type}'`
          ),
        },
        is_channel_partner: false,
        parent_tenant_id: this.requestParams.tenant.id,
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
            moment(item.date_trunc).format(interval[range].sub_format) ===
            moment().format(interval[range].sub_format)
        )?.count || 0;

      last =
        lastCount.find(
          (item) =>
            moment(item.date_trunc).format(interval[range].sub_format) ===
            moment()
              .subtract(1, interval[range].sub_type)
              .format(interval[range].sub_format)
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

    for (const item of tenantsCount[0]) {
      dataObj[moment(item.created_at).format(interval[range].format)] =
        +item.count;
    }

    let sumValue = 0;
    let categories = [];
    let data = [];
    for (const [key, value] of Object.entries(dataObj)) {
      sumValue += value;
      categories.push(key);
      data.push(sumValue);
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

  async activeTenants(range: string) {
    let interval = {
      by_week: {
        arg: 1,
        sub_value: 7,
        format: "YYYY-MM-DD",
        type: "week",
        by: "day",
        sub_type: "week",
        sub_format: "YYYY-MM-DD",
      },
      by_month: {
        arg: 30,
        format: "YYYY-MM-DD",
        sub_value: 30,
        type: "day",
        by: "day",
        sub_type: "month",
        sub_format: "YYYY-MM",
      },
      by_year: {
        arg: 1,
        format: "YYYY-MM",
        sub_value: 12,
        type: "year",
        by: "month",
        sub_type: "year",
        sub_format: "YYYY",
      },
    };

    const activeTenants: any = await this.sequelize.query(
      `select date_trunc('${interval[range].by}', "createdAt")::date AS created_at, count(t.id) as "count" from ${DB_PUBLIC_SCHEMA}.tenants t where t."createdAt" > current_timestamp - interval '${interval[range].arg} ${interval[range].type}' and t."is_channel_partner" = false and t."is_active" = true and t."parent_tenant_id" = '${this.requestParams.tenant.id}' group by date_trunc('${interval[range].by}', "createdAt");
    `
    );

    const lastCount = await this.tenant.schema(DB_PUBLIC_SCHEMA).count({
      where: {
        createdAt: {
          [Op.gte]: literal(
            `current_timestamp - interval '2 ${interval[range].sub_type}'`
          ),
        },
        is_channel_partner: false,
        parent_tenant_id: this.requestParams.tenant.id,
        is_active: true,
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
            moment(item.date_trunc).format(interval[range].sub_format) ===
            moment().format(interval[range].sub_format)
        )?.count || 0;

      last =
        lastCount.find(
          (item) =>
            moment(item.date_trunc).format(interval[range].sub_format) ===
            moment()
              .subtract(1, interval[range].sub_type)
              .format(interval[range].sub_format)
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

    for (const item of activeTenants[0]) {
      dataObj[moment(item.created_at).format(interval[range].format)] =
        +item.count;
    }

    let sumValue = 0;
    let categories = [];
    let data = [];
    for (const [key, value] of Object.entries(dataObj)) {
      sumValue += value;
      categories.push(key);
      data.push(sumValue);
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

  async surveyCount(range: string) {
    let interval = {
      by_week: {
        arg: 1,
        sub_value: 7,
        format: "YYYY-MM-DD",
        type: "week",
        by: "day",
        sub_type: "week",
        sub_format: "YYYY-MM-DD",
      },
      by_month: {
        arg: 30,
        format: "YYYY-MM-DD",
        sub_value: 30,
        type: "day",
        by: "day",
        sub_type: "month",
        sub_format: "YYYY-MM",
      },
      by_year: {
        arg: 1,
        format: "YYYY-MM",
        sub_value: 12,
        type: "year",
        by: "month",
        sub_type: "year",
        sub_format: "YYYY",
      },
    };

    const currentDate = moment(new Date()).add(1, "day").format("YYYY/MM/DD");
    const endDate = moment(new Date())
      .subtract(interval[range].sub_value, interval[range].by)
      .format("YYYY/MM/DD");

    const tenants = await this.tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      attributes: ["id"],
      where: { parent_tenant_id: this.requestParams.tenant.id },
    });

    let tenantsArr = [`'${this.requestParams.tenant.id}'`];
    let tenantsArray = [this.requestParams.tenant.id];
    for (let tenant of tenants) {
      tenantsArr.push(`'${tenant.id}'`);
      tenantsArray.push(tenant.id);
    }

    const surveyCount: any = await this.sequelize.query(
      `select date_trunc('${interval[range].by}', "createdAt")::date AS created_at, count(t.id) as "count" from ${DB_PUBLIC_SCHEMA}."tenant_history" t where t."createdAt" > current_timestamp - interval '${interval[range].arg} ${interval[range].type}' and t."group" = 'survey' and t."tenant_id" IN (${tenantsArr}) group by date_trunc('${interval[range].by}', "createdAt");
      `
    );

    // `select date_trunc('${interval[range].by}', "createdAt")::date AS created_at, count(t.id) as "count",t."type" from public."tenant_history" t where t."createdAt" > current_timestamp - interval '${interval[range].arg} ${interval[range].type}' and t."type" IN ('ongoing_survey','completed_survey') and t."tenant_id" IN ('${tenantsArr}') group by date_trunc('${interval[range].by}', "createdAt"),t."type";
    //

    const ongoing_survey = await this.tenantHistory
      .schema(DB_PUBLIC_SCHEMA)
      .unscoped()
      .count({
        attributes: [
          ["type", "name"],
          [fn("count", col("id")), "value"],
        ],
        group: ["name"],
        where: {
          createdAt: {
            [Op.between]: [fn("date", endDate), fn("date", currentDate)],
          },
          tenant_id: [...tenantsArray],
          type: TenantHistoryTypes.ongoing_survey,
        },
      });

    const completed_survey = await this.tenantHistory
      .schema(DB_PUBLIC_SCHEMA)
      .unscoped()
      .count({
        attributes: [
          ["type", "name"],
          [fn("count", col("id")), "value"],
        ],
        group: ["name"],
        where: {
          createdAt: {
            [Op.between]: [fn("date", endDate), fn("date", currentDate)],
          },
          tenant_id: [...tenantsArray],
          type: TenantHistoryTypes.completed_survey,
        },
      });

    let pieChart = [...ongoing_survey, ...completed_survey];

    const lastCount = await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).count({
      where: {
        createdAt: {
          [Op.gte]: literal(
            `current_timestamp - interval '2 ${interval[range].sub_type}'`
          ),
        },
        tenant_id: [...tenantsArray],
        group: TenantHistoryGroup.survey,
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
            moment(item.date_trunc).format(interval[range].sub_format) ===
            moment().format(interval[range].sub_format)
        )?.count || 0;

      last =
        lastCount.find(
          (item) =>
            moment(item.date_trunc).format(interval[range].sub_format) ===
            moment()
              .subtract(1, interval[range].sub_type)
              .format(interval[range].sub_format)
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
      data.push(sumValue);
    }

    const thisWeekCount = await this.tenantHistory
      .schema(DB_PUBLIC_SCHEMA)
      .count({
        where: {
          type: TenantHistoryTypes.completed_survey,
          createdAt: {
            [Op.gte]: literal(
              `date_trunc('${interval[range].sub_type}', now())`
            ),
          },
          tenant_id: [...tenantsArray],
        },
      });

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
      pieChart,
      thisWeekCount,
      percentage,
      current,
      last,
    };
  }

  async industryChart(range: string) {
    let interval = {
      by_week: {
        arg: 1,
        sub_value: 7,
        format: "week",
        type: "week",
        by: "day",
        sub_type: "week",
        sub_format: "YYYY-MM-DD",
      },
      by_month: {
        arg: 30,
        format: "month",
        sub_value: 30,
        type: "day",
        by: "day",
        sub_type: "month",
        sub_format: "YYYY-MM",
      },
      by_year: {
        arg: 1,
        format: "year",
        sub_value: 12,
        type: "year",
        by: "month",
        sub_type: "year",
        sub_format: "YYYY",
      },
    };

    const currentDate = moment(new Date()).add(1, "day").format("YYYY/MM/DD");

    const endDate = moment(new Date())
      .subtract(interval[range].sub_value, interval[range].by)
      .format("YYYY/MM/DD");

    const industryCountGet = await this.industry
      .schema(DB_PUBLIC_SCHEMA)
      .unscoped()
      .findAll({
        attributes: ["name"],
        where: {
          tenant_id: this.requestParams.tenant.id,
        },
        include: [
          {
            model: Tenant.schema(DB_PUBLIC_SCHEMA),
            attributes: ["id"],
            required: false,
            where: {
              createdAt: {
                [Op.between]: [fn("date", endDate), fn("date", currentDate)],
              },
            },
          },
        ],
      });

    const lastCountGet = await this.tenant
      .unscoped()
      .schema(DB_PUBLIC_SCHEMA)
      .count({
        where: {
          createdAt: {
            [Op.gt]: literal(
              `current_timestamp - interval '2 ${interval[range].sub_type}'`
            ),
          },
          parent_tenant_id: this.requestParams.tenant.id,
        },
        group: [fn("date_trunc", interval[range].sub_type, col("createdAt"))],
      });

    const [industryCount, lastCount] = await Promise.all([
      industryCountGet,
      lastCountGet,
    ]);

    const current =
      lastCount.find(
        (item) =>
          moment(item.date_trunc)[interval[range].format]() ===
          moment()[interval[range].format]()
      )?.count || 0;
    const last =
      lastCount.find(
        (item) =>
          moment(item.date_trunc)[interval[range].format]() ===
          moment()
            .subtract(1, interval[range].sub_type)
            [interval[range].format]()
      )?.count || 0;

    return {
      percentage: ((current - last) / last) * 100,
      lastCount,
      industryCount,
    };
  }

  async getCompetency() {
    const competencyGet = await this.tenantHistory
      .schema(DB_PUBLIC_SCHEMA)
      .count({
        where: {
          tenant_id: this.requestParams.tenant.id,
          type: TenantHistoryTypes.competency,
        },
      });

    const thisWeekCountGet = await this.tenantHistory
      .schema(DB_PUBLIC_SCHEMA)
      .count({
        where: {
          tenant_id: this.requestParams.tenant.id,
          type: TenantHistoryTypes.competency,
          createdAt: {
            [Op.gte]: literal(`date_trunc('week', now())`),
          },
        },
      });

    const [competency, thisWeekCount] = await Promise.all([
      competencyGet,
      thisWeekCountGet,
    ]);

    return { competency, thisWeekCount };
  }

  async getQuestions() {
    const questionGet = await this.tenantHistory
      .schema(DB_PUBLIC_SCHEMA)
      .count({
        where: {
          tenant_id: this.requestParams.tenant.id,
          type: TenantHistoryTypes.question,
        },
      });

    const thisWeekCountGet = await this.tenantHistory
      .schema(DB_PUBLIC_SCHEMA)
      .count({
        where: {
          tenant_id: this.requestParams.tenant.id,
          type: TenantHistoryTypes.question,
          createdAt: {
            [Op.gte]: literal(`date_trunc('week', now())`),
          },
        },
      });

    const [question, thisWeekCount] = await Promise.all([
      questionGet,
      thisWeekCountGet,
    ]);

    return { question, thisWeekCount };
  }

  async allTenants() {
    const tenants = await this.tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      attributes: [
        "id",
        "name",
        "schema_name",
        "start_date",
        "tenant_pic",
        "is_active",
        "no_of_employee",
        "createdAt",
      ],
      limit: 15,
      where: {
        parent_tenant_id: this.requestParams.tenant.id,
      },
      include: [
        {
          model: TenantHistory,
          attributes: ["type"],
          where: {
            type: TenantHistoryTypes.completed_survey,
          },
          required: false,
        },
      ],
    });
    return tenants;
  }

  async getAllSurveysForTenant(id: string) {
    return this.surveyDescription.schema(id).findAndCountAll({
      where: {
        ...getSearchObject(this.requestParams.query, ["title", "status"]),
      },
      ...this.requestParams.pagination,
    });
  }
}
