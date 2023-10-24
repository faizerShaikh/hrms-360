import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Cron, CronExpression } from "@nestjs/schedule";
import { literal, Op, QueryTypes } from "sequelize";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { Rater } from "src/modules/settings/modules/rater/models";
const ExcelJS = require("exceljs");

import {
  Survey,
  SurveyDescription,
  SurveyExternalRespondant,
  SurveyRespondant,
  SurveyResponse,
} from "src/modules/surveys/models";
import {
  SurveyDescriptionStatus,
  SurveyRespondantStatus,
  SurveyStatus,
} from "src/modules/surveys/type";
import { Tenant, TenantUser } from "src/modules/tenants/models";
import { User } from "src/modules/users/models";
import { MailsService } from "../mails";
import { defaultAttachments, defaultContext } from "../mails/constants";
import { Sequelize } from "sequelize-typescript";
import { databaseConfig } from "src/config";
import { publicTables, schemaTables } from "../db";
import * as moment from "moment";

@Injectable()
export class CronjobService {
  sequelize: Sequelize;
  constructor(
    private readonly mailService: MailsService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService // @Inject(MOMENT) moment: Moment, // @Inject(MOMENT_TZ) mtz: MomentTz
  ) {
    this.sequelize = new Sequelize({
      ...databaseConfig[config.get("NODE_ENV") || "development"],
      models: [...publicTables, ...schemaTables],
    });
  }

  // @Cron("5 * * * * *")
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async surveyAlertJob() {
    const tenants = await Tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      where: { is_channel_partner: false },
    });

    for (let tenant of tenants) {
      const Respondents = await SurveyRespondant.schema(
        tenant.schema_name
      ).findAll({
        where: {
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: Survey.schema(tenant.schema_name),
            include: [
              {
                model: User.schema(tenant.schema_name),
                attributes: ["name", "email"],
              },
              {
                model: SurveyDescription.schema(tenant.schema_name),
                attributes: ["title", "end_date"],
              },
            ],
          },
          {
            model: Rater.schema(tenant.schema_name),
            attributes: ["category_name"],
          },
        ],
      });

      const ExternalRespondents = await SurveyExternalRespondant.schema(
        tenant.schema_name
      ).findAll({
        where: {
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: Survey.schema(tenant.schema_name),
            include: [
              {
                model: User.schema(tenant.schema_name),
                attributes: ["name", "email"],
              },
              {
                model: SurveyDescription.schema(tenant.schema_name),
                attributes: ["title", "end_date"],
              },
            ],
          },
          {
            model: Rater.schema(tenant.schema_name),
            attributes: ["category_name"],
          },
        ],
      });

      for (const resp of Respondents) {
        if (new Date(resp.survey.survey_description.end_date) > new Date()) {
          const token = await this.jwtService.signAsync(
            {
              id: resp.id,
              schema_name: tenant.schema_name,
              is_external: false,
            },
            {
              secret: this.config.get("JWTKEY"),
            }
          );
          let Mail = {
            to: resp.respondant.email,
            subject: `Reminder to fill Feedback Survey | ${resp.survey.survey_description.title}`,
            context: {
              link: `${this.config.get("FE_URL")}/survey/assessment/${token}`,
              username: resp.respondant.name,
              logo: "cid:company-logo",
              requester: `${resp.survey.employee.name} (${resp.survey.employee.designation.name})`,
              relation: resp.rater.category_name,
              survey_name: resp.survey.survey_description.title,
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
          this.mailService.SurveyAlertMail(Mail);
        }
      }

      for (const resp of ExternalRespondents) {
        if (new Date(resp.survey.survey_description.end_date) > new Date()) {
          const token = await this.jwtService.signAsync(
            {
              id: resp.id,
              schema_name: tenant.schema_name,
              is_external: false,
            },
            {
              secret: this.config.get("JWTKEY"),
            }
          );
          let Mail = {
            to: resp.respondant_email,
            subject: `Reminder to fill Feedback Survey  | ${resp.survey.survey_description.title}`,
            context: {
              link: `${this.config.get("FE_URL")}/survey/assessment/${token}`,
              username: resp.respondant_name,
              logo: "cid:company-logo",
              requester: `${resp.survey.employee.name} (${resp.survey.employee.designation.name})`,
              relation: resp.rater.category_name,
              survey_name: resp.survey.survey_description.title,
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
          this.mailService.SurveyAlertMail(Mail);
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async surveyAlertJob2() {
    await this.ReminderMailFrequency(1, "Day");
    await this.ReminderMailFrequency(2, "Day");
    await this.ReminderMailFrequency(3, "Day");
    await this.ReminderMailFrequency(4, "Day");
    await this.ReminderMailFrequency(5, "Day");
    await this.ReminderMailFrequency(6, "Day");
    await this.ReminderMailFrequency(7, "Day");
    // await this.ReminderMailFrequency(1, "Week");
    // await this.ReminderMailFrequency(2, "Week");
    // await this.ReminderMailFrequency(3, "Week");
    // await this.ReminderMailFrequency(4, "Week");
    // await this.ReminderMailFrequency(5, "Week");
    // await this.ReminderMailFrequency(6, "Week");
    // await this.ReminderMailFrequency(7, "Week");
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async tenantExpireJob() {
    const currentDate = new Date();
    const tenants = await Tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      group: ['"Tenant"."id"', '"admin"."id"'],
      where: {
        is_channel_partner: false,
        admin_id: {
          [Op.ne]: null,
        },
        end_date: {
          [Op.between]: [
            new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
          ],
        },
      },
      include: [
        {
          model: TenantUser.schema(DB_PUBLIC_SCHEMA),
          as: "admin",
        },
      ],
    });

    for (const tenant of tenants) {
      const endDate = new Date(tenant.end_date);
      if (
        endDate.getMonth() === currentDate.getMonth() &&
        endDate > currentDate
      ) {
        let Mail = {
          to: tenant.admin.email,
          subject:
            "Intimation for end of subscription | Insight 360 Feedback for Leaders",
          context: {
            link: `${this.config.get("FE_URL")}`,
            username: tenant.admin.name,
            end_date: new Date(tenant.end_date).toLocaleDateString(),
            logo: "cid:company-logo",
            ...defaultContext,
          },
          attachments: [
            {
              filename: "nbol-email-logo",
              path: "src/public/media/images/nbol-email-logo.png",
              cid: "company-logo",
            },
          ],
        };
        this.mailService.TenantSubscriptionAlertMail(Mail);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async dailySurveyExpiryCheck() {
    const tenants = await Tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      where: {
        is_channel_partner: false,
      },
    });
    for (const tenant of tenants) {
      const surveys = await SurveyDescription.schema(
        tenant.schema_name
      ).findAll({
        where: {
          status: {
            [Op.notIn]: ["Completed"],
          },
          end_date: {
            [Op.lt]: literal("current_date"),
          },
        },
      });

      for (const survey of surveys) {
        await survey.update({
          status: SurveyDescriptionStatus.Closed,
          previous_status: survey.status,
        });
      }
      await Survey.schema(tenant.schema_name).update(
        { status: "Closed", previous_status: literal("status") },
        { where: { survey_id: surveys.map((item) => item.id) } }
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async dailySurveyProgressMail() {
    const tenants = await Tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      where: {
        is_channel_partner: false,
      },
      group: [
        "Tenant.id",
        "admin.id",
        "parent_tenant.id",
        "parent_tenant.admin.id",
      ],
      include: [
        {
          model: TenantUser.schema(DB_PUBLIC_SCHEMA),
          as: "admin",
          where: {
            is_tenant_admin: true,
          },
          required: false,
        },
        {
          model: Tenant.schema(DB_PUBLIC_SCHEMA),
          as: "parent_tenant",
          include: [
            {
              model: TenantUser.schema(DB_PUBLIC_SCHEMA),
              as: "admin",
            },
          ],
        },
      ],
    });

    for (const tenant of tenants) {
      // console.log(tenant);
      const workbook = new ExcelJS.Workbook();

      const sheet = workbook.addWorksheet("Report", {
        views: [{ state: "frozen", ySplit: 1 }],
        pageSetup: {
          horizontalCentered: true,
          verticalCentered: true,
        },
      });
      let rowData = [];
      const channel_partner = await Tenant.schema(DB_PUBLIC_SCHEMA).findOne({
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
      let allsystemadmins = channel_partner.users
        .map((obj) => obj.email)
        .join(", ");

      const surveys = await SurveyDescription.schema(
        tenant.schema_name
      ).findAll({
        where: {
          status: {
            [Op.notIn]: ["Completed"],
          },
          end_date: {
            [Op.gt]: literal("current_date"),
          },
        },
        include: [
          {
            model: Rater.schema(tenant.schema_name),
            include: [
              {
                model: SurveyRespondant.schema(tenant.schema_name),
                include: [
                  {
                    model: SurveyResponse.schema(tenant.schema_name),
                  },
                ],
              },
              {
                model: SurveyExternalRespondant.schema(tenant.schema_name),
                include: [
                  {
                    model: SurveyResponse.schema(tenant.schema_name),
                  },
                ],
              },
            ],
          },
        ],
      });

      const surveyDescriptions = await SurveyDescription.schema(
        tenant.schema_name
      ).findAll({
        where: {
          status: {
            [Op.notIn]: [
              SurveyDescriptionStatus.Terminated,
              SurveyDescriptionStatus.Closed,
            ],
          },
          end_date: {
            [Op.gt]: literal("current_date"),
          },
        },
        include: [
          {
            model: Survey.schema(tenant.schema_name),
            include: [
              {
                model: User.schema(tenant.schema_name),
              },
              {
                model: SurveyRespondant.schema(tenant.schema_name),
                include: [
                  {
                    model: Rater.schema(tenant.schema_name),
                  },
                  {
                    model: User.schema(tenant.schema_name),
                  },
                ],
              },
              {
                model: SurveyExternalRespondant.schema(tenant.schema_name),
                include: [
                  {
                    model: Rater.schema(tenant.schema_name),
                  },
                ],
              },
            ],
          },
        ],
      });

      let rowValue = [
        "Client Name",
        "Survey Name",
        "Ratee Survey Status",
        "Ratee Name",
        "Rater Name",
        "No. of Reminders sent",
        "Rater Category",
        "Survey Completed",
        "Completion Date",
      ];
      rowData.push(rowValue);
      for (const surveyDescription of surveyDescriptions) {
        let rowData2 = [];
        const workbook2 = new ExcelJS.Workbook();

        const sheet2 = workbook2.addWorksheet("Individual-Report", {
          views: [{ state: "frozen", ySplit: 1 }],
          pageSetup: {
            horizontalCentered: true,
            verticalCentered: true,
          },
        });
        rowData2.push(rowValue);
        for (const survey of surveyDescription.surveys) {
          if (survey.survey_respondants.length > 0) {
            for (const respodants of survey.survey_respondants) {
              rowData.push([
                tenant?.name,
                surveyDescription?.title,
                survey?.status,
                survey?.employee?.name,
                respodants?.respondant?.name,
                0,
                respodants?.rater?.category_name,
                respodants.status === "Completed" ? "Y" : "N",
                respodants.status === "Completed" ? respodants.updatedAt : "-",
              ]);
              rowData2.push([
                tenant?.name,
                surveyDescription?.title,
                survey?.status,
                survey?.employee?.name,
                respodants?.respondant?.name,
                0,
                respodants?.rater?.category_name,
                respodants.status === "Completed" ? "Y" : "N",
                respodants.status === "Completed" ? respodants.updatedAt : "-",
              ]);
            }
          }
          if (survey.survey_external_respondants.length > 0) {
            for (const respodants of survey.survey_external_respondants) {
              rowData.push([
                tenant.name,
                surveyDescription?.title,
                survey.status,
                survey?.employee?.name,
                respodants?.respondant_name,
                0,
                respodants?.rater?.category_name,
                respodants.status === "Completed" ? "Y" : "N",
                respodants.status === "Completed" ? respodants.updatedAt : "-",
              ]);
              rowData2.push([
                tenant.name,
                surveyDescription?.title,
                survey.status,
                survey?.employee?.name,
                respodants?.respondant_name,
                0,
                respodants?.rater?.category_name,
                respodants.status === "Completed" ? "Y" : "N",
                respodants.status === "Completed" ? respodants.updatedAt : "-",
              ]);
            }
          }
        }
        rowData2.forEach((row) => {
          sheet2.addRow(row);
        });
        sheet2.columns.forEach((column) => {
          column.width = 30; // Adjust the desired width here
        });
        sheet2.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFF00" },
          bgColor: { argb: "FF00FF00" },
        };
        var formattedTitle = surveyDescription.title.replace(/ /g, "-");
        await workbook2.xlsx.writeFile(
          `./src/public/media/excels/${formattedTitle}.xlsx`
        );
        rowData2.length = 0;
      }
      rowData.forEach((row) => {
        sheet.addRow(row);
      });

      sheet.columns.forEach((column) => {
        column.width = 30; // Adjust the desired width here
      });
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" },
        bgColor: { argb: "FF00FF00" },
      };
      await workbook.xlsx.writeFile(
        `./src/public/media/excels/${tenant.name}.xlsx`
      );
      rowData.length = 0;
      let mailsentArr = [];

      if (
        surveys.length > 0 &&
        !mailsentArr.includes(tenant?.admin?.email + tenant.schema_name)
      ) {
        mailsentArr.push(tenant?.admin?.email + tenant.schema_name);
        let Mail = {
          to: tenant?.admin?.email,
          cc: allsystemadmins,
          // bcc: channel_partner.users.email,
          subject: `All Survey Progress | ${tenant.schema_name}`,
          context: {
            firstName: tenant?.admin?.name,
            link: `${this.config.get("FE_URL")}`,
            data: surveys,
            username: tenant?.admin?.name,
            // end_date: new Date(tenant.end_date).toLocaleDateString(),
            logo: "cid:company-logo",
            ...defaultContext,
          },
          attachments: [
            {
              filename: "nbol-email-logo",
              path: "src/public/media/images/nbol-email-logo.png",
              cid: "company-logo",
            },
            {
              filename: `${tenant.name}.xlsx`,
              path: `src/public/media/excels/${tenant.name}.xlsx`,
              cid: "report",
            },
          ],
        };
        this.mailService.DailySurveyProgressMail(Mail);
      }
      for (const survey of surveys) {
        let allrespodants = [];
        let mailSentSingle = [];
        if (
          survey.raters.length > 0 &&
          !mailsentArr.includes(tenant?.admin?.email + survey.title)
        ) {
          mailSentSingle.push(tenant?.admin?.email + survey.title);

          for (const item of survey.raters) {
            if (item.surveyRespondant.length > 0) {
              item.surveyRespondant.map((i) => {
                allrespodants.push(i);
              });
            }
            if (item.surveyExternalRespondant.length > 0) {
              item.surveyExternalRespondant.map((i) => {
                allrespodants.push(i);
              });
            }
          }
          var formattedTitle = survey.title.replace(/ /g, "-");
          let Mail = {
            to: tenant?.admin?.email,
            cc: allsystemadmins,
            subject: `Survey Progress for ${survey.title}`,
            context: {
              firstName: tenant?.admin?.name,
              link: `${this.config.get("FE_URL")}`,
              surveyName: survey.title,
              data: survey.raters,
              allRespondant: allrespodants,
              username: tenant?.admin?.name,
              system_link: `${this.config.get("FE_URL")}/sign-in`,
              hero_logo: "cid:hero-logo",
              box_logo: "cid:box-logo",
              // end_date: new Date(tenant.end_date).toLocaleDateString(),
              logo: "cid:company-logo",
              ...defaultContext,
            },
            attachments: [
              {
                filename: `${formattedTitle}.xlsx`,
                path: `src/public/media/excels/${formattedTitle}.xlsx`,
                cid: "report",
              },
              {
                filename: "nbol-email-logo",
                path: "src/public/media/images/nbol-email-logo.png",
                cid: "company-logo",
              },
            ],
          };
          this.mailService.DailySingleSurveyProgressMail(Mail);
        }
      }
    }
  }

  async ReminderMailFrequency(value, parameter) {
    const tenants = await Tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      where: {
        is_channel_partner: false,
      },
    });

    for (let tenant of tenants) {
      let days = parameter === "Day" ? value : 7 * value;
      let reminder = value + " " + parameter;
      const Respondents = await SurveyRespondant.schema(
        tenant.schema_name
      ).findAll({
        where: {
          status: SurveyRespondantStatus.Ongoing,
        },
        // group: ['"SurveyRespondant"."User"."id"'],
        include: [
          {
            model: Survey.schema(tenant.schema_name),
            include: [
              {
                model: User.schema(tenant.schema_name),
                attributes: ["name", "email"],
              },
              {
                model: SurveyDescription.schema(tenant.schema_name),
                attributes: [
                  "id",
                  "title",
                  "end_date",
                  [
                    literal(
                      `EXTRACT(DAY FROM AGE(CURRENT_DATE, "survey->survey_description"."createdAt"))::integer % ${days}`
                    ),
                    "date_difference",
                  ],
                  [
                    literal(
                      `EXTRACT(DAY FROM AGE(CURRENT_DATE, "survey->survey_description"."createdAt"))`
                    ),
                    "daysSinceCreation",
                  ],
                  "createdAt",
                  "reminder_frequency",
                ],
                where: {
                  [Op.and]: [
                    Sequelize.literal(
                      `EXTRACT(DAY FROM AGE(CURRENT_DATE, "survey->survey_description"."createdAt"))::integer % ${days}=0`
                    ),
                    Sequelize.literal(`"reminder_frequency" = '${reminder}'`),
                  ],
                },
              },
            ],
            where: {
              status: SurveyStatus.Ongoing,
            },
            required: true,
          },
          {
            model: User.schema(tenant.schema_name),
            attributes: ["id", "name", "email"],
          },
          {
            model: Rater.schema(tenant.schema_name),
            attributes: ["category_name"],
          },
        ],
      });

      let mailsentArr = [];

      for (const resp of Respondents) {
        if (new Date(resp.survey.survey_description.end_date) > new Date()) {
          // const token = await this.jwtService.signAsync(
          //   {
          //     id: resp.id,
          //     survey_id: resp.survey.survey_description.id,
          //     schema_name: tenant.schema_name,
          //     is_external: false,
          //   },
          //   {
          //     secret: this.config.get("JWTKEY"),
          //   }

          const token = await this.jwtService.signAsync(
            {
              id: resp?.respondant?.id,
              survey_respondant_id: resp.id,
              survey_id: resp.survey.survey_description.id,
              schema_name: tenant.schema_name,
              is_external: false,
            },
            {
              secret: this.config.get("JWTKEY"),
            }
          );

          if (
            !mailsentArr.includes(
              resp?.respondant?.email + resp.survey.survey_description.title
            )
          ) {
            mailsentArr.push(
              resp?.respondant?.email + resp.survey.survey_description.title
            );

            let Mail = {
              to: resp?.respondant?.email,
              subject: `Reminder to fill Feedback Survey | ${resp.survey.survey_description.title}`,
              context: {
                link: `${this.config.get(
                  "FE_URL"
                )}/survey/assessment/instructions/${token}`,
                username: resp?.respondant?.name,
                tenantName: tenant.name,
                logo: "cid:company-logo",
                requester: `${resp.survey.employee.name} (${resp.survey?.employee?.designation?.name})`,
                relation: resp.rater.category_name,
                survey_name: resp.survey.survey_description.title,
                endDate: moment(resp.survey.survey_description.end_date).format(
                  "DD/MM/YY"
                ),
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
            this.mailService.SurveyMail(Mail);
          }
        }
      }

      const ExternalRespondents = await SurveyExternalRespondant.schema(
        tenant.schema_name
      ).findAll({
        where: {
          status: SurveyRespondantStatus.Ongoing,
        },
        include: [
          {
            model: Survey.schema(tenant.schema_name),
            include: [
              {
                model: User.schema(tenant.schema_name),
                attributes: ["name", "email"],
              },
              {
                model: SurveyDescription.schema(tenant.schema_name),
                attributes: [
                  "title",
                  "end_date",
                  [
                    literal(
                      `EXTRACT(DAY FROM AGE(CURRENT_DATE, "survey->survey_description"."createdAt"))::integer % ${days}`
                    ),
                    "date_difference",
                  ],
                  [
                    literal(
                      `EXTRACT(DAY FROM AGE(CURRENT_DATE, "survey->survey_description"."createdAt"))`
                    ),
                    "daysSinceCreation",
                  ],
                  "createdAt",
                  "reminder_frequency",
                ],
                where: {
                  // reminder_frequency: "3 Day",
                  [Op.and]: [
                    Sequelize.literal(
                      `EXTRACT(DAY FROM AGE(CURRENT_DATE, "survey->survey_description"."createdAt"))::integer % ${days}=0`
                    ),
                    Sequelize.literal(`"reminder_frequency" = '${reminder}'`),
                  ],
                },
              },
            ],
            where: {
              status: SurveyStatus.Ongoing,
            },
            required: true,
          },
          {
            model: Rater.schema(tenant.schema_name),
            attributes: ["category_name"],
          },
        ],
      });

      // var externalmailSent = [];
      for (const resp of ExternalRespondents) {
        if (new Date(resp.survey.survey_description.end_date) > new Date()) {
          // const token = await this.jwtService.signAsync({
          //   id: resp.id,
          //   survey_id: resp.survey.survey_description.id,
          //   schema_name: tenant.schema_name,
          //   is_external: false,
          // });
          const token = await this.jwtService.signAsync(
            {
              id: resp.id,
              survey_id: resp.survey.survey_description.id,
              schema_name: tenant.schema_name,
              is_external: true,
            },
            {
              secret: this.config.get("JWTKEY"),
            }
          );
          if (!mailsentArr.includes(resp.respondant_email)) {
            mailsentArr.push(resp.respondant_email);
            let Mail = {
              to: resp.respondant_email,
              subject: `Reminder to fill Feedback Survey  | ${resp.survey.survey_description.title}`,
              // context: {
              //   link: `${this.config.get("FE_URL")}/survey/assessment/${token}`,
              //   username: resp.respondant_name,
              //   logo: "cid:company-logo",
              //   requester: `${resp.survey.employee.name} (${resp.survey?.employee?.designation?.name})`,
              //   relation: resp.rater.category_name,
              //   survey_name: resp.survey.survey_description.title,
              //   ...defaultContext,
              // },
              context: {
                link: `${this.config.get(
                  "FE_URL"
                )}/survey/assessment/instructions/${token}`,
                username: resp?.respondant_name,
                tenantName: tenant.name,
                logo: "cid:company-logo",
                requester: `${resp.survey.employee.name} (${resp.survey?.employee?.designation?.name})`,
                relation: resp.rater.category_name,
                survey_name: resp.survey.survey_description.title,
                endDate: moment(resp.survey.survey_description.end_date).format(
                  "DD/MM/YY"
                ),
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
            this.mailService.SurveyMail(Mail);
          }
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async dailySurveyExpiryCheck2() {
    try {
      await this.sequelize.query("CALL survey_datetime_check();", {
        type: QueryTypes.RAW,
      });
    } catch (error) {
      console.log(error);
    }
  }
}
