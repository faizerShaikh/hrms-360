import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Cron, CronExpression } from "@nestjs/schedule";
import { literal, Op, QueryTypes } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { databaseConfig } from "src/config";
import { Designation } from "src/modules/settings/modules/designation/models";
import { Rater } from "src/modules/settings/modules/rater/models";
import {
  Survey,
  SurveyDescription,
  SurveyExternalRespondant,
  SurveyRespondant,
} from "src/modules/surveys/models";
import {
  SurveyDescriptionStatus,
  SurveyRespondantStatus,
  SurveyStatus,
} from "src/modules/surveys/type";
import { Tenant, TenantUser } from "src/modules/tenants/models";
import { User } from "src/modules/users/models";
import { publicTables, schemaTables } from "../db";
import { MailsService } from "../mails";
import { defaultContext } from "../mails/constants";

@Injectable()
export class CronjobService {
  sequelize: Sequelize;
  constructor(
    private readonly mailService: MailsService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService
  ) {
    this.sequelize = new Sequelize({
      ...databaseConfig[config.get("NODE_ENV") || "development"],
      logging: true,
      models: [...publicTables, ...schemaTables],
      dialectOptions: {
        clientMinMessages: false,
      },
      keepDefaultTimezone: true,
    });
  }

  // @Cron("5 * * * * *")
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async surveyAlertJob() {
    try {
      const tenants = await Tenant.schema(DB_PUBLIC_SCHEMA).findAll({
        where: { is_channel_partner: false, is_active: true },
      });

      for (let tenant of tenants) {
        const surveyDescriptions = await SurveyDescription.schema(
          tenant.schema_name
        ).findAll({
          where: {
            status: SurveyDescriptionStatus.Ongoing,
          },
        });

        for (const surveyDescription of surveyDescriptions) {
          if (surveyDescription?.response_form === "Multiple Ratee") {
            try {
              const respondents = await SurveyRespondant.schema(
                tenant.schema_name
              ).findAll({
                where: {
                  status: SurveyRespondantStatus.Ongoing,
                },
                include: [
                  {
                    attributes: [],
                    model: Survey,
                    where: {
                      survey_id: surveyDescription.id,
                      status: SurveyStatus.Ongoing,
                    },
                  },
                  {
                    model: User,
                    attributes: ["name", "email", "id"],
                  },
                  { model: Rater },
                ],
              });
              const externalRespondants = await SurveyExternalRespondant.schema(
                tenant.schema_name
              )
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
                        survey_id: surveyDescription.id,
                        status: SurveyStatus.Ongoing,
                      },
                    },
                  ],
                });
              const maxLength = Math.max(
                respondents.length,
                externalRespondants.length
              );

              let alreadySent = [];
              let alreadySentExternal = [];

              for (let index = 0; index < maxLength; index++) {
                const url = "multiple";
                if (
                  respondents[index] &&
                  !alreadySent.includes(respondents[index].respondant.email)
                ) {
                  const token = await this.jwtService.signAsync(
                    {
                      id: respondents[index].respondant_id,
                      respondant_id: respondents[index].id,
                      survey_id: surveyDescription.id,
                      schema_name: tenant.schema_name,
                      is_external: false,
                    },
                    {
                      secret: this.config.get("JWTKEY"),
                    }
                  );
                  let Mail = {
                    to: respondents[index].respondant.email,
                    subject: `Reminder to complete Survey | ${surveyDescription.title}`,
                    context: {
                      link: `${this.config.get(
                        "FE_URL"
                      )}/survey/assessment/${url}/${token}`,
                      username: respondents[index].respondant.name,
                      logo: "cid:company-logo",
                      survey_name: surveyDescription.title,
                    },
                    attachments: [
                      {
                        filename: "company-logo",
                        path: "src/public/media/images/company-logo.png",
                        cid: "company-logo",
                      },
                    ],
                  };
                  this.mailService.SurveyAlertMail(Mail);
                  alreadySent.push(respondents[index].respondant.email);
                }

                if (
                  externalRespondants[index] &&
                  !alreadySentExternal.includes(
                    externalRespondants[index].respondant_email
                  )
                ) {
                  const token = await this.jwtService.signAsync(
                    {
                      email: externalRespondants[index].respondant_email,
                      schema_name: tenant.schema_name,
                      is_external: true,
                      survey_id: surveyDescription.id,
                    },
                    {
                      secret: this.config.get("JWTKEY"),
                    }
                  );

                  let Mail = {
                    to: externalRespondants[index].respondant_email,
                    subject: `Reminder to complete Survey | ${surveyDescription.title}`,
                    context: {
                      link: `${this.config.get(
                        "FE_URL"
                      )}/survey/assessment/${url}/${token}`,
                      username: externalRespondants[index].respondant_name,
                      logo: "cid:company-logo",
                      survey_name: surveyDescription.title,
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
                  this.mailService.SurveyAlertMail(Mail);
                  alreadySentExternal.push(
                    externalRespondants[index].respondant_email
                  );
                }
              }

              console.log(alreadySent);
            } catch (error) {
              throw error;
            }
          } else {
            try {
              const surveys = await Survey.schema(tenant.schema_name).findAll({
                where: {
                  status: SurveyStatus.Ongoing,
                  survey_id: surveyDescription.id,
                },
              });

              for (const survey of surveys) {
                const respondents = await SurveyRespondant.schema(
                  tenant.schema_name
                ).findAll({
                  where: { survey_id: survey.id },
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

                const externalRespondents =
                  await SurveyExternalRespondant.schema(
                    tenant.schema_name
                  ).findAll({
                    where: { survey_id: survey.id },
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

                for (let index = 0; index < maxLength; index++) {
                  const url = "single";
                  if (respondents[index]) {
                    const token = await this.jwtService.signAsync(
                      {
                        id: respondents[index].respondant_id,
                        respondant_id: respondents[index].id,
                        survey_id: survey.survey_id,
                        schema_name: tenant.schema_name,
                        is_external: false,
                      },
                      {
                        secret: this.config.get("JWTKEY"),
                      }
                    );
                    let Mail = {
                      to: respondents[index].respondant.email,
                      subject: `Reminder to complete Survey | ${surveyDescription.title}`,
                      context: {
                        link: `${this.config.get(
                          "FE_URL"
                        )}/survey/assessment/${url}/${token}`,
                        username: respondents[index].respondant.email,
                        logo: "cid:company-logo",
                        survey_name: surveyDescription.title,
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
                    this.mailService.SurveyAlertMail(Mail);
                  }
                  if (externalRespondents[index]) {
                    const token = await this.jwtService.signAsync(
                      {
                        respondant_id: externalRespondents[index].id,
                        survey_id: survey.survey_id,
                        schema_name: tenant.schema_name,
                        is_external: false,
                      },
                      {
                        secret: this.config.get("JWTKEY"),
                      }
                    );
                    let Mail = {
                      to: externalRespondents[index].respondant_email,
                      subject: `Reminder to complete Survey | ${surveyDescription.title}`,
                      context: {
                        link: `${this.config.get(
                          "FE_URL"
                        )}/survey/assessment/${url}/${token}`,
                        username: externalRespondents[index].respondant_name,
                        logo: "cid:company-logo",
                        survey_name: surveyDescription.title,
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
                    this.mailService.SurveyAlertMail(Mail);
                  }
                }
              }
            } catch (error) {
              throw error;
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
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
          model: TenantUser,
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
            "Intimation for end of subscription | HRMS 360 Feedback Tool",
          context: {
            link: `${this.config.get("FE_URL")}`,
            username: tenant.admin.name,
            end_date: new Date(tenant.end_date).toLocaleDateString(),
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
        this.mailService.TenantSubscriptionAlertMail(Mail);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyExpiryCheck() {
    const tenants = await Tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      where: {
        is_active: true,
      },
      include: [
        {
          model: TenantUser,
          as: "admin",
        },
      ],
    });

    for (const tenant of tenants) {
      let end_date = new Date(tenant.end_date);
      let current_date = new Date();
      if (end_date < current_date) {
        await Tenant.schema(DB_PUBLIC_SCHEMA).update(
          { is_active: false },
          {
            where: {
              id: tenant.id,
            },
          }
        );
        let Mail = {
          to: tenant.admin.email,
          subject: "End of subscription | HRMS 360 Feedback Tool",
          context: {
            link: `${this.config.get("FE_URL")}`,
            username: tenant.admin.name,
            end_date: new Date(tenant.end_date).toLocaleDateString(),
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
        this.mailService.TenantSubscriptionAlertMail(Mail, true);
      }
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async dailySurveyExpiryCheck() {
    try {
      await this.sequelize.query("CALL survey_datetime_check();", {
        type: QueryTypes.RAW,
      });
    } catch (error) {
      console.log(error);
    }
  }
}
