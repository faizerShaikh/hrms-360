import { Injectable } from "@nestjs/common";
import * as moment from "moment";
import { fn, literal, Op } from "sequelize";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { Survey, SurveyDescription } from "src/modules/surveys/models";
import { Tenant, TenantMetaData, TenantUser } from "src/modules/tenants/models";
import { SurveyDescriptionStatus } from "src/modules/surveys/type";

const ExcelJS = require("exceljs");

@Injectable()
export class ApsisReportsService {
  constructor() {}

  async AllSurveysReport(start_month?: string, end_month?: string) {
    let monthRange =
      start_month && end_month
        ? {
            createdAt: {
              [Op.between]: [
                fn(
                  "date",
                  moment(new Date(start_month))
                    .startOf("month")
                    .format("YYYY/MM/DD")
                ),
                fn(
                  "date",
                  moment(new Date(end_month))
                    .endOf("month")
                    .format("YYYY/MM/DD")
                ),
              ],
            },
          }
        : {};

    const tenants = await Tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      raw: true,
      attributes: ["id", "name", "schema_name", "parent_tenant_id"],
      where: {
        is_channel_partner: false,
      },
    });

    let Result = [];

    for (let tenant of tenants) {
      const ChannelPartner = await Tenant.schema(DB_PUBLIC_SCHEMA).findByPk(
        tenant.parent_tenant_id,
        {
          raw: true,
          attributes: [["name", "channel_partner_name"]],
        }
      );

      const tenantSurveys = await SurveyDescription.schema(
        tenant.schema_name
      ).findAll({
        include: [
          {
            model: Survey.schema(tenant.schema_name),
            attributes: ["id", "no_of_respondents"],
          },
        ],
        where: {
          ...monthRange,
        },
      });

      Result.push({ ...tenant, ...ChannelPartner, surveys: tenantSurveys });
    }

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("All Surveys Report", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = [
      { header: "Survey Name", key: "survey_name", width: 30 },
      { header: "Survey Status", key: "survey_status", width: 30 },
      { header: "Survey Month", key: "survey_month", width: 30 },
      { header: "Survey Year", key: "survey_year", width: 30 },
      { header: "Tenant Name", key: "tenant_name", width: 30 },
      {
        header: "Channel Partner Name",
        key: "channel_partner_name",
        width: 30,
      },
      { header: "Ratee Count", key: "ratee_count", width: 30 },
      { header: "Rater Count", key: "rater_count", width: 30 },
      {
        header: "Line Manager Approval (Y/N)",
        key: "line_manager_approval",
        width: 30,
      },
      { header: "Total Participation", key: "total_participation", width: 30 },
      { header: "% Participation", key: "participation_percentage", width: 30 },
    ];

    let ResultantArray = [];
    Result.forEach((tenantItem) => {
      tenantItem?.surveys.forEach((survey) => {
        ResultantArray.push({
          id: survey.id,
          survey_name: survey.title,
          survey_status: survey.status,
          survey_month: moment(new Date(survey.end_date)).format("MMMM"),
          survey_year: moment(new Date(survey.end_date)).format("YYYY"),
          tenant_name: tenantItem.name,
          channel_partner_name: tenantItem.channel_partner_name,
          ratee_count: parseInt(survey.total_assessments),
          rater_count:
            survey?.surveys?.reduce((prev, curr) => {
              return prev + curr?.no_of_respondents;
            }, 0) || 0,
          line_manager_approval: survey.is_lm_approval_required ? "Y" : "N",
          total_participation:
            parseInt(survey.total_assessments) +
            parseInt(survey?.surveys[0]?.no_of_respondents || 0) *
              survey.total_assessments,
          participation_percentage: (
            (survey.assessments_completed / survey.total_assessments) *
            100
          )
            ?.toFixed(2)
            .replace(/[.,]00$/, ""),
        });
      });
    });
    const UniqueTime = new Date().getTime().toString();
    if (ResultantArray?.length > 0) {
      sheet.addRows(ResultantArray);

      await workbook.xlsx.writeFile(
        `./src/public/media/reports/report-${UniqueTime}.xlsx`
      );
    }

    return {
      file_path:
        ResultantArray?.length > 0
          ? `/media/reports/report-${UniqueTime}.xlsx`
          : null,
      data: ResultantArray,
    };
  }

  async TenantWiseReport(start_month?: string, end_month?: string) {
    let monthRange =
      start_month && end_month
        ? {
            createdAt: {
              [Op.between]: [
                fn(
                  "date",
                  moment(new Date(start_month))
                    .startOf("month")
                    .format("YYYY/MM/DD")
                ),
                fn(
                  "date",
                  moment(new Date(end_month))
                    .endOf("month")
                    .format("YYYY/MM/DD")
                ),
              ],
            },
          }
        : {};

    const tenants = await Tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      raw: true,
      where: {
        is_channel_partner: false,
        ...monthRange,
      },
      include: [
        {
          model: Tenant.schema(DB_PUBLIC_SCHEMA),
          as: "parent_tenant",
          attributes: [["name", "channel_partner_name"]],
        },
        {
          as: "admin",
          model: TenantUser.schema(DB_PUBLIC_SCHEMA),
          required: false,
          on: literal('"Tenant"."admin_id" = "admin"."id"'),
          attributes: ["email", "name"],
        },
      ],
      group: ["Tenant.id", "parent_tenant.id", "admin.id"],
    });

    let Result = [];

    for (let tenant of tenants) {
      const surveys_count = await SurveyDescription.schema(
        tenant.schema_name
      ).count({
        group: ["status"],
      });

      const Surveys = await SurveyDescription.schema(
        tenant.schema_name
      ).findAll({
        attributes: ["id", "title", "total_assessments"],
        include: [
          {
            model: Survey.schema(tenant.schema_name),
            attributes: ["id", "no_of_respondents"],
          },
        ],
      });

      let rater_count = Surveys.reduce((prev, curr) => {
        return (
          prev +
          curr.surveys.reduce((prevSurvey, currSurvey) => {
            return prevSurvey + currSurvey.no_of_respondents;
          }, 0)
        );
      }, 0);

      let ratee_count = Surveys.reduce((prev, curr) => {
        return prev + curr.total_assessments;
      }, 0);

      Result.push({
        ...tenant,
        ratee_count,
        rater_count,
        surveys_count,
      });
    }

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("Tenant-wise Report till date", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = [
      { header: "Tenant Name", key: "tenant_name", width: 30 },
      { header: "Tenant Type", key: "tenant_type", width: 30 },
      { header: "Channel Partner", key: "channel_partner", width: 30 },
      { header: "Tenant Status", key: "tenant_status", width: 30 },
      {
        header: "No.of times re-activated",
        key: "no_of_reactivation",
        width: 30,
      },
      {
        header: "Last Onboarding Date",
        key: "last_onboarding_date",
        width: 30,
      },
      { header: "Tenant Expiry Date", key: "tenant_expiry_date", width: 30 },
      {
        header: "Activation Tenure (Months)",
        key: "activation_tenure",
        width: 30,
      },
      { header: "Organization Admin", key: "admin_name", width: 30 },
      {
        header: "Organization Admin email Id",
        key: "admin_email",
        width: 30,
      },
      {
        header: "Count of Employees",
        key: "employee_count",
        width: 30,
      },
      {
        header: "Surveys Launched",
        key: "surveys_launched",
        width: 30,
      },
      {
        header: "Surveys Ongoing",
        key: "surveys_ongoing",
        width: 30,
      },
      {
        header: "Surveys Terminated",
        key: "surveys_terminated",
        width: 30,
      },
      {
        header: "Surveys Completed",
        key: "surveys_completed",
        width: 30,
      },
      {
        header: "Ratee Count",
        key: "ratee_count",
        width: 30,
      },
      {
        header: "Rater Count",
        key: "rater_count",
        width: 30,
      },
      {
        header: "Total Participant Count",
        key: "total_participant_count",
        width: 30,
      },
    ];

    let ResultantArray = [];

    Result.forEach((tenant) => {
      ResultantArray.push({
        id: tenant?.id,
        tenant_name: tenant?.name,
        tenant_type: tenant?.admin_type,
        channel_partner: tenant["parent_tenant.channel_partner_name"],
        tenant_status: tenant?.is_active ? "Active" : "Inactive",
        no_of_reactivation: "-",
        last_onboarding_date: "-",
        tenant_expiry_date: tenant?.end_date,
        activation_tenure: `${tenant?.tenure}`,
        admin_name: tenant["admin.name"],
        admin_email: tenant["admin.email"],
        employee_count: tenant?.no_of_employee,
        surveys_launched:
          tenant?.surveys_count?.reduce((prev, curr) => {
            return prev + curr?.count;
          }, 0) || 0,
        surveys_ongoing:
          tenant?.surveys_count
            ?.filter(
              (item) =>
                item?.status === SurveyDescriptionStatus?.Ongoing ||
                item?.status === SurveyDescriptionStatus?.Initiated ||
                item?.status === SurveyDescriptionStatus?.In_Progress
            )
            ?.reduce((prev, curr) => {
              return prev + curr?.count;
            }, 0) || 0,
        surveys_terminated:
          tenant?.surveys_count?.filter(
            (item) => item?.status === SurveyDescriptionStatus?.Terminated
          )?.[0]?.count || 0,
        surveys_completed:
          tenant?.surveys_count?.filter(
            (item) => item?.status === SurveyDescriptionStatus?.Completed
          )?.[0]?.count || 0,
        ratee_count: tenant?.ratee_count,
        rater_count: tenant?.rater_count,
        total_participant_count: tenant?.ratee_count + tenant?.rater_count,
      });
    });
    const UniqueTime = new Date().getTime().toString();

    if (ResultantArray?.length > 0) {
      sheet.addRows(ResultantArray);

      await workbook.xlsx.writeFile(
        `./src/public/media/reports/report-${UniqueTime}.xlsx`
      );
    }

    return {
      file_path:
        ResultantArray?.length > 0
          ? `/media/reports/report-${UniqueTime}.xlsx`
          : null,
      data: ResultantArray,
    };
  }

  async ChannelPartnerReport(start_month?: string, end_month?: string) {
    let ResultantArray = [];

    if (start_month && end_month) {
      let Result = [];
      const tenants = await Tenant.schema(DB_PUBLIC_SCHEMA).findAll({
        raw: true,
        where: {
          is_channel_partner: true,
          createdAt: {
            [Op.between]: [
              fn(
                "date",
                moment(new Date(start_month))
                  .startOf("month")
                  .format("YYYY/MM/DD")
              ),
              fn(
                "date",
                moment(new Date(end_month)).endOf("month").format("YYYY/MM/DD")
              ),
            ],
          },
        },
      });

      for (let tenant of tenants) {
        const tenant_count = await Tenant.schema(DB_PUBLIC_SCHEMA).count({
          where: {
            parent_tenant_id: tenant.id,
          },
          group: ["is_active"],
        });

        const childTenants = await Tenant.schema(DB_PUBLIC_SCHEMA).findAll({
          where: {
            parent_tenant_id: tenant.id,
          },
        });

        let output = [];
        let raters_count = 0;
        let ratees_count = 0;
        for (let childTenant of childTenants) {
          let survey_count = await SurveyDescription.schema(
            childTenant.schema_name
          ).count({
            group: ["status"],
          });

          output.push(...survey_count);

          const Surveys = await SurveyDescription.schema(
            childTenant.schema_name
          ).findAll({
            attributes: ["id", "title", "total_assessments"],
            include: [
              {
                model: Survey.schema(childTenant.schema_name),
                attributes: ["id", "no_of_respondents"],
              },
            ],
          });

          let rater_output = Surveys.reduce((prev, curr) => {
            return (
              prev +
              curr.surveys.reduce((prevSurvey, currSurvey) => {
                return prevSurvey + currSurvey.no_of_respondents;
              }, 0)
            );
          }, 0);

          let ratee_output = Surveys.reduce((prev, curr) => {
            return prev + curr.total_assessments;
          }, 0);

          raters_count += rater_output;
          ratees_count += ratee_output;
        }

        var surveys_count = [];

        output.forEach(function (item) {
          var existing = surveys_count.filter(function (v) {
            return v.status == item.status;
          });
          if (existing.length) {
            var existingIndex = surveys_count.indexOf(existing[0]);
            surveys_count[existingIndex].count =
              surveys_count[existingIndex].count + item.count;
          } else {
            surveys_count.push(item);
          }
        });

        Result.push({
          ...tenant,
          surveys_count,
          tenant_count,
          raters_count,
          ratees_count,
        });
      }

      Result.forEach((tenant) => {
        ResultantArray.push({
          id: tenant?.id,
          channel_partner: tenant?.name,
          last_activation_date: "-",
          status: tenant?.is_active ? "Active" : "InActive",
          total_tenants:
            tenant?.tenant_count?.reduce(
              (prev, curr) => prev + curr?.count,
              0
            ) || 0,
          active_tenant_count:
            tenant?.tenant_count?.filter((item) => item?.is_active)?.[0]
              ?.count || 0,
          inactive_tenant_count:
            tenant?.tenant_count?.filter((item) => !item?.is_active)?.[0]
              ?.count || 0,
          total_users_onboarded: tenant?.total_users_onboarded,
          surveys_launched:
            tenant?.surveys_count?.reduce((prev, curr) => {
              return prev + curr?.count;
            }, 0) || 0,
          surveys_ongoing:
            tenant?.surveys_count
              ?.filter(
                (item) =>
                  item?.status === SurveyDescriptionStatus?.Ongoing ||
                  item?.status === SurveyDescriptionStatus?.Initiated ||
                  item?.status === SurveyDescriptionStatus?.In_Progress
              )
              ?.reduce((prev, curr) => {
                return prev + curr?.count;
              }, 0) || 0,
          surveys_completed:
            tenant?.surveys_count?.filter(
              (item) => item?.status === SurveyDescriptionStatus?.Completed
            )?.[0]?.count || 0,
          surveys_terminated:
            tenant?.surveys_count?.filter(
              (item) => item?.status === SurveyDescriptionStatus?.Terminated
            )?.[0]?.count || 0,
          ratee_count: tenant?.ratees_count,
          rater_count: tenant?.raters_count,
          total_participant_count: tenant?.ratees_count + tenant?.raters_count,
        });
      });
    } else {
      const CPTenants = await TenantMetaData.schema(DB_PUBLIC_SCHEMA).findAll({
        raw: true,
        include: [
          {
            model: Tenant,
            attributes: ["is_active"],
          },
        ],
      });

      CPTenants.forEach((tenant) => {
        ResultantArray.push({
          id: tenant?.id,
          channel_partner: tenant?.name,
          last_activation_date: "-",
          status: tenant?.tenant?.is_active ? "Active" : "InActive",
          total_tenants: tenant?.total_tenants,
          active_tenant_count: tenant?.active_tenant_count,
          inactive_tenant_count: tenant?.inactive_tenant_count,
          total_users_onboarded: tenant?.total_users_onboarded,
          surveys_launched: tenant?.surveys_launched_count,
          surveys_ongoing: tenant?.surveys_ongoing_count,
          surveys_completed: tenant?.surveys_completed_count,
          surveys_terminated: tenant?.surveys_terminated_count,
          ratee_count: tenant?.ratee_count,
          rater_count: tenant?.rater_count,
          total_participant_count: tenant?.ratee_count + tenant?.rater_count,
        });
      });
    }

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("Channel Partner Report till date", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = [
      { header: "Channel Partner Name", key: "channel_partner", width: 30 },
      {
        header: "Last Activation Date",
        key: "last_activation_date",
        width: 30,
      },
      { header: "Status", key: "status", width: 30 },
      {
        header: "Total Tenants",
        key: "total_tenants",
        width: 30,
      },
      {
        header: "Active Tenant Count",
        key: "active_tenant_count",
        width: 30,
      },
      {
        header: "Inactive Tenant Count",
        key: "inactive_tenant_count",
        width: 30,
      },
      {
        header: "Total Users Onboarded",
        key: "total_users_onboarded",
        width: 30,
      },
      {
        header: "Surveys Launched",
        key: "surveys_launched",
        width: 30,
      },
      {
        header: "Surveys Ongoing",
        key: "surveys_ongoing",
        width: 30,
      },
      {
        header: "Surveys Completed",
        key: "surveys_completed",
        width: 30,
      },
      {
        header: "Surveys Terminated",
        key: "surveys_terminated",
        width: 30,
      },
      {
        header: "Ratee Count",
        key: "ratee_count",
        width: 30,
      },
      {
        header: "Rater Count",
        key: "rater_count",
        width: 30,
      },
      {
        header: "Total Participant Count",
        key: "total_participant_count",
        width: 30,
      },
    ];

    const UniqueTime = new Date().getTime().toString();
    if (ResultantArray?.length > 0) {
      sheet.addRows(ResultantArray);

      await workbook.xlsx.writeFile(
        `./src/public/media/reports/report-${UniqueTime}.xlsx`
      );
    }

    return {
      file_path:
        ResultantArray?.length > 0
          ? `/media/reports/report-${UniqueTime}.xlsx`
          : null,
      data: ResultantArray,
    };
  }
}
