import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { Sequelize } from "sequelize-typescript";
import { Tenant, TenantHistory, TenantUser } from "../models";
import { CreateTenant } from "../dtos";
import {
  bcrypt,
  getRandomPassword,
  getSearchObject,
  getUserTableQuery,
} from "src/common/helpers";
import { Department } from "src/modules/settings/modules/department/models";
import { Designation } from "src/modules/settings/modules/designation/models";
import { existsSync, unlink } from "fs";
import {
  commonModels,
  DB_PUBLIC_SCHEMA,
  publicModels,
} from "src/common/constants";
import { Rater } from "src/modules/settings/modules/rater/models";
import { UpdateTenant } from "../dtos/updateTenant.dto";
import {
  AdminTypeOptions,
  TenantHistoryGroup,
  TenantHistoryTypes,
} from "../types";
import { MailsService } from "src/common/modules/mails";
import { ConfigService } from "@nestjs/config";
import {
  defaultAttachments,
  defaultAttachmentsNBOL,
  defaultContext,
} from "src/common/modules/mails/constants";
import { RequestParamsService } from "src/common/modules";
import { Industry } from "src/modules/settings/modules/industry/models";
import { col, fn, literal, Op, Transaction } from "sequelize";
import * as moment from "moment";

import { User } from "src/modules/users/models";
import {
  Survey,
  SurveyDescription,
  SurveyRespondant,
  SurveyResponse,
} from "src/modules/surveys/models";
import {
  SurveyDescriptionStatus,
  SurveyRespondantStatus,
} from "src/modules/surveys/type";
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
import { SurveyService } from "src/modules/surveys/app/survey.service";
import { NbolSurveyService } from "src/modules/surveys/app/nbolSurvey.service";
import { Competency } from "src/modules/competencies/models";

@Injectable()
export class TenantsService {
  private readonly logger: Logger;

  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(Tenant) private readonly tenant: typeof Tenant,
    @InjectModel(Department)
    private readonly department: typeof Department,
    @InjectModel(Designation)
    private readonly designation: typeof Designation,
    @InjectModel(Rater)
    private readonly rater: typeof Rater,
    @InjectModel(TenantUser)
    private readonly tenantUser: typeof TenantUser,
    private readonly requestParamsService: RequestParamsService,
    private readonly mailService: MailsService,
    private readonly mailsService: MailsService,
    private readonly config: ConfigService,
    private readonly surveyService: SurveyService,
    private readonly nbolSurveyService: NbolSurveyService
  ) {
    this.logger = new Logger();
  }

  async setInitialSetup() {
    for (const model of publicModels) {
      await this.sequelize.models[model].schema(DB_PUBLIC_SCHEMA).sync({
        alter: true,
      });
    }

    let password = await bcrypt.createHash("1234");
    try {
      await this.sequelize.models["ApsisUser"]
        .schema(DB_PUBLIC_SCHEMA)
        .findOrCreate({
          where: { email: "admin@apsissolutions.com" },
          defaults: {
            email: "admin@apsissolutions.com",
            password,
          },
        });
    } catch (error) {
      if (error && error?.name !== "SequelizeUniqueConstraintError") {
        throw error;
      }
    }

    return "Initial Setup successfully";
  }

  async runMigrations(body: string[]) {
    const tenants = await this.tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      where: {
        is_channel_partner: false,
      },
      paranoid: false,
    });

    for (const tenant of tenants) {
      await this.sequelize.query(`set search_path to ${tenant.schema_name};`);
      if (body.length) {
        for (const model of body) {
          if (!publicModels.includes(model)) {
            if (model === "User") {
              await this.sequelize.query(
                `alter table ${tenant.schema_name}.users NO INHERIT ${DB_PUBLIC_SCHEMA}.tenant_users`
              );
              await this.sequelize.models[model]
                .schema(tenant.schema_name)
                .sync({ alter: true });
              await this.sequelize.query(
                `alter table ${tenant.schema_name}.users INHERIT ${DB_PUBLIC_SCHEMA}.tenant_users`
              );
              this.logger.log(
                `Table ${model} updated for schema ${tenant.schema_name}`
              );
            } else if (this.sequelize.models[model]) {
              await this.sequelize.models[model]
                .schema(tenant.schema_name)
                .sync({ alter: true });
              this.logger.log(
                `Table ${model} updated for schema ${tenant.schema_name}`
              );
            }
          }
        }
      } else {
        for (const model of Object.values(this.sequelize.models)) {
          if (!publicModels.includes(model.name) && model.name !== "User") {
            await model.schema(tenant.schema_name).sync({ alter: true });
            this.logger.log(
              `Table ${model.name} updated for schema ${tenant.schema_name}`
            );
          }
        }
      }
    }

    return "All schemas migrated successfully";
  }

  async createTenant(body: CreateTenant) {
    // body.tenant.admin_type === AdminTypeOptions.on_premise;
    console.log(body, "BODY");

    const isTenantExist = await this.tenant.schema(DB_PUBLIC_SCHEMA).findOne({
      where: {
        schema_name: body.tenant.schema_name,
      },
    });

    if (isTenantExist)
      throw new BadRequestException("Tenant with this name already exist");

    // need to genrate random password for user and send email
    let password = getRandomPassword();
    let hashPassword = await bcrypt.createHash(password);
    const t = await this.sequelize.transaction();
    let queryOptions = { transaction: t };

    let admin: TenantUser;
    let tenant: Tenant;

    try {
      if (body.tenant.admin_type !== AdminTypeOptions.channel_partner) {
        const user = await this.tenantUser.schema(DB_PUBLIC_SCHEMA).findOne({
          where: { email: body.user.email },
          include: [{ model: Tenant }],
        });

        if (user) {
          if (user.my_tenant.is_channel_partner) {
            throw new BadRequestException(
              "User with this email already exists!"
            );
          }
          const isUserInTenant = await User.schema(
            user.my_tenant.schema_name
          ).findOne({
            where: { email: body.user.email },
          });
          if (isUserInTenant)
            throw new BadRequestException(
              "User with this email already exists!"
            );
        }
        admin = await this.tenantUser.schema(DB_PUBLIC_SCHEMA).create(
          {
            ...body.user,
            password: hashPassword,
            region: body.tenant.location,
            is_tenant_admin: true,
          },
          queryOptions
        );
      }

      tenant = await this.tenant.schema(DB_PUBLIC_SCHEMA).create(
        {
          ...body.tenant,
          // start_date: body?.tenant?.start_date
          //   ? body?.tenant?.start_date
          //   : moment().format("YYYY-MM-DD"),
          schema_name: body.tenant.schema_name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9 _]/g, "")
            .replace(/ /g, "_"),
          admin_id: admin?.id ? admin.id : null,
          // is_active:
          //   body.tenant.is_active === false
          //     ? false
          //     : !(
          //         new Date(body.tenant.start_date).getTime() >
          //         new Date().getTime()
          //       ) &&
          //       new Date(body.tenant.end_date).getTime() > new Date().getTime(),
        },
        queryOptions
      );

      if (body.tenant.admin_type === AdminTypeOptions.on_premise) {
        await admin.update(
          {
            tenant_id: tenant.id,
          },
          queryOptions
        );
      }

      await this.createSchema(
        tenant,
        admin,
        hashPassword,
        queryOptions.transaction
      );

      if (admin) {
        let Mail = {
          to: admin.email,
          subject: `New Tenant Account Creation | Login Details for ${tenant.name}`,
          context: {
            email: admin.email,
            password,
            firstName: admin.name,
            system_link: `${this.config.get("FE_URL")}/sign-in`,
            be_link: this.config.get("BE_URL"),
            logo: "cid:company-logo",
            ...defaultContext,
            is_tenant: true,
          },
          attachments: [
            {
              filename: "nbol-email-logo",
              path: "src/public/media/images/nbol-email-logo.png",
              cid: "company-logo",
            },

            ...defaultAttachmentsNBOL,
          ],
        };
        this.mailsService.TenantRegisterMail(Mail);
      }

      await t.commit();
      return tenant;
    } catch (error) {
      await this.sequelize.dropSchema(
        body.tenant.schema_name
          .toLowerCase()
          .replace(/[^a-zA-Z0-9 _]/g, "")
          .replace(/ /g, "_"),
        {}
      );
      await t.rollback();
      throw error;
    }
  }

  async updateTenant(id: string, body: UpdateTenant) {
    if (body.tenant && body.tenant.schema_name) {
      body.tenant.schema_name = undefined;
    }
    body.tenant.admin_type = undefined;

    const isTenantExist = await this.tenant.schema(DB_PUBLIC_SCHEMA).findOne({
      where: {
        id,
      },
      include: [
        {
          as: "admin",
          model: TenantUser,
          required: false,
          on: literal('"Tenant"."admin_id" = "admin"."id"'),
          attributes: ["email", "name", "id"],
        },
      ],
    });

    if (!isTenantExist) throw new BadRequestException("Tenant does not exist");

    if (
      !!body.tenant.no_of_employee &&
      isTenantExist.no_of_employee > body.tenant.no_of_employee &&
      isTenantExist.no_of_employee_created > body.tenant.no_of_employee
    ) {
      throw new BadRequestException(
        "Employees created in tenant are greated then updated number of employees"
      );
    }

    const transaction = await this.sequelize.transaction();
    try {
      let tenant = await this.tenant.schema(DB_PUBLIC_SCHEMA).update(
        {
          ...body.tenant,
          // is_active:
          //   body.tenant.is_active === false
          //     ? false
          //     : body.tenant.end_date
          //     ? !(
          //         new Date(body.tenant.start_date).getTime() >
          //         new Date().getTime()
          //       ) &&
          //       new Date(body.tenant.end_date).getTime() > new Date().getTime()
          //     : true,
        },
        { where: { id }, transaction }
      );
      if (body.user && isTenantExist.admin) {
        // if (
        //   isTenantExist.admin_type !== body.tenant.admin_type &&
        //   body.tenant.admin_type === AdminTypeOptions.on_premise
        // ) {
        //   const user = await this.tenantUser.findOne({
        //     where: { email: body.user.email },
        //     include: [{ model: Tenant }],
        //   });
        //   if (user) {
        //     const isUserInTenant = await User.schema(
        //       user.my_tenant.schema_name
        //     ).findOne({
        //       where: { email: body.user.email },
        //     });
        //     if (isUserInTenant)
        //       throw new BadRequestException(
        //         "User with this email already exists!"
        //       );
        //   }
        //   let password = getRandomPassword();
        //   let hashPassword = await bcrypt.createHash(password);
        //   let admin = await this.tenantUser.create(
        //     {
        //       ...body.user,
        //       password: hashPassword,
        //       region: body.tenant.location,
        //       is_tenant_admin: true,
        //     },
        //     { transaction }
        //   );
        //   await this.tenant.update(
        //     {
        //       ...body.tenant,
        //       is_active:
        //         body.tenant.is_active === false
        //           ? false
        //           : !(
        //               new Date(body.tenant.start_date).getTime() >
        //               new Date().getTime()
        //             ),
        //       admin_id: admin.id,
        //     },
        //     { where: { id }, transaction }
        //   );
        //   let Mail = {
        //     to: admin.email,
        //     subject: `New Tenant Account Creation | Login Details for ${body.tenant.name}`,
        //     context: {
        //       email: admin.email,
        //       password,
        //       system_link: `${this.config.get("FE_URL")}/sign-in`,
        //       be_link: this.config.get("BE_URL"),
        //       logo: "cid:company-logo",
        //       ...defaultContext,
        //       is_tenant: true,
        //     },
        //     attachments: [
        //       {
        //         filename: "company-logo",
        //         path: "src/public/media/images/company-logo.png",
        //         cid: "company-logo",
        //       },
        //       ...defaultAttachments,
        //     ],
        //   };
        //   this.mailsService.TenantRegisterMail(Mail);
        // } else {
        //   if (
        //     isTenantExist.admin.name !== body.user.name ||
        //     isTenantExist.admin.email !== body.user.email
        //   ) {
        //     const user = await this.tenantUser.findOne({
        //       where: { email: body.user.email },
        //       include: [{ model: Tenant }],
        //     });
        //     if (user) {
        //       const isUserInTenant = await User.schema(
        //         user.my_tenant.schema_name
        //       ).findOne({
        //         where: { email: body.user.email },
        //       });
        //       if (isUserInTenant)
        //         throw new BadRequestException(
        //           "User with this email already exists!"
        //         );
        //     }
        //   }
        //   await isTenantExist.admin.update(
        //     {
        //       name: body.user.name,
        //       email: body.user.email,
        //     },
        //     { transaction }
        //   );
        //   await User.schema(isTenantExist.schema_name).update(
        //     {
        //       name: body.user.name,
        //       email: body.user.email,
        //       // is_tenant_admin:
        //       //   isTenantExist.admin_type !== body.tenant.admin_type &&
        //       //   body.tenant.admin_type === AdminTypeOptions.channel_partner
        //       //     ? false
        //       //     : true,
        //     },
        //     {
        //       transaction,
        //       where: {
        //         email: isTenantExist.admin.id,
        //       },
        //     }
        //   );
      }
      // }
      // if (body.tenant.is_active === true && isTenantExist.is_active === false) {
      //   await this.tenantMetaData.schema(DB_PUBLIC_SCHEMA).update(
      //     {
      //       active_tenant_count: literal(`active_tenant_count  + 1`),
      //       inactive_tenant_count: literal(`inactive_tenant_count  - 1`),
      //     },
      //     {
      //       where: { tenant_id: isTenantExist?.parent_tenant_id },
      //       transaction,
      //     }
      //   );
      // } else if (
      //   body.tenant.is_active === false &&
      //   isTenantExist.is_active === true
      // ) {
      //   await this.tenantMetaData.schema(DB_PUBLIC_SCHEMA).update(
      //     {
      //       active_tenant_count: literal(`active_tenant_count  - 1`),
      //       inactive_tenant_count: literal(`inactive_tenant_count  + 1`),
      //     },
      //     {
      //       where: { tenant_id: isTenantExist?.parent_tenant_id },
      //       transaction,
      //     }
      //   );
      // }

      await transaction.commit();
      return tenant;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteTenant(id: string) {
    const isTenantExist = await this.tenant.schema(DB_PUBLIC_SCHEMA).findOne({
      where: {
        id,
      },
    });

    if (!isTenantExist) throw new BadRequestException("Tenant does not exist");

    let tenant = await isTenantExist.update({
      is_active: !isTenantExist.is_active,
    });

    // if (!isTenantExist.is_active === false) {
    //   await this.tenantMetaData.schema(DB_PUBLIC_SCHEMA).update(
    //     {
    //       active_tenant_count: literal(`active_tenant_count  - 1`),
    //       inactive_tenant_count: literal(`inactive_tenant_count  + 1`),
    //     },
    //     {
    //       where: { tenant_id: isTenantExist?.parent_tenant_id },
    //     }
    //   );
    // } else if (!isTenantExist.is_active === true) {
    //   await this.tenantMetaData.schema(DB_PUBLIC_SCHEMA).update(
    //     {
    //       active_tenant_count: literal(`active_tenant_count  + 1`),
    //       inactive_tenant_count: literal(`inactive_tenant_count  - 1`),
    //     },
    //     {
    //       where: { tenant_id: isTenantExist?.parent_tenant_id },
    //     }
    //   );
    // }

    if (isTenantExist.is_channel_partner) {
      this.tenant.schema(DB_PUBLIC_SCHEMA).update(
        { is_active: !isTenantExist.is_active },
        {
          where: {
            parent_tenant_id: isTenantExist.id,
          },
        }
      );
    }

    return tenant;
  }

  async createChannelPartner(body: CreateTenant) {
    const isTenantExist = await this.tenant.schema(DB_PUBLIC_SCHEMA).findOne({
      where: {
        schema_name: body.tenant.schema_name,
      },
    });

    if (isTenantExist)
      throw new BadRequestException("Tenant with this name already exist");

    // need to genrate random password for user and send email
    let password = getRandomPassword();
    let hashPassword = await bcrypt.createHash(password);
    const t = await this.sequelize.transaction();
    let queryOptions = { transaction: t };

    let admin: TenantUser;
    let tenant: Tenant;

    try {
      if (body.tenant.admin_type !== AdminTypeOptions.channel_partner) {
        const user = await this.tenantUser.schema(DB_PUBLIC_SCHEMA).findOne({
          where: { email: body.user.email },
          include: [{ model: Tenant }],
        });

        if (user) {
          if (user.my_tenant.is_channel_partner) {
            throw new BadRequestException(
              "User with this email already exists!"
            );
          }
          const isUserInTenant = await User.schema(
            user.my_tenant.schema_name
          ).findOne({
            where: { email: body.user.email },
          });
          if (isUserInTenant)
            throw new BadRequestException(
              "User with this email already exists!"
            );
        }
        admin = await this.tenantUser.schema(DB_PUBLIC_SCHEMA).create(
          {
            ...body.user,
            password: hashPassword,
            region: body.tenant.location,
            is_tenant_admin: true,
          },
          queryOptions
        );
      }

      tenant = await this.tenant.schema(DB_PUBLIC_SCHEMA).create(
        {
          ...body.tenant,

          schema_name: body.tenant.schema_name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9 _]/g, "")
            .replace(/ /g, "_"),
          admin_id: admin?.id ? admin.id : null,
          is_channel_partner: true,
          is_active:
            body.tenant.is_active === false
              ? false
              : !(
                  new Date(body.tenant.start_date).getTime() >
                  new Date().getTime()
                ) &&
                new Date(body.tenant.end_date).getTime() > new Date().getTime(),
        },
        queryOptions
      );

      if (body.tenant.admin_type === AdminTypeOptions.on_premise) {
        await admin.update(
          {
            tenant_id: tenant.id,
          },
          queryOptions
        );
      }

      // if (body.tenant.is_own_schema) {
      //   await this.createSchema(
      //     tenant,
      //     admin,
      //     hashPassword,
      //     queryOptions.transaction
      //   );
      // }

      let Mail = {
        to: admin.email,
        subject: `New Tenant Account Creation | Login Details for ${tenant.name}`,
        context: {
          email: admin.email,
          password,
          firstName: admin.name,
          system_link: `${this.config.get("FE_URL")}/sign-in`,
          be_link: this.config.get("BE_URL"),
          logo: "cid:company-logo",
          ...defaultContext,
          is_tenant: true,
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

      this.mailsService.TenantRegisterMail(Mail);
      await t.commit();
      return tenant;
    } catch (error) {
      if (body.tenant.is_own_schema) {
        await this.sequelize.dropSchema(
          body.tenant.schema_name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9 _]/g, "")
            .replace(/ /g, "_"),
          {}
        );
      }
      await t.rollback();
      throw error;
    }
  }

  async uploadTenantLogo(file: Express.Multer.File, id: string) {
    const tenant = await this.tenant.schema(DB_PUBLIC_SCHEMA).findOne({
      where: {
        id,
      },
    });

    if (!tenant) throw new NotFoundException("Tenant not found");

    if (tenant.tenant_pic) {
      if (existsSync("src/public" + tenant.tenant_pic)) {
        unlink("src/public" + tenant.tenant_pic, (err) => {
          if (err) {
            throw new InternalServerErrorException(err);
          }
          console.log("file deleted...");
        });
      }
    }

    await tenant.update({
      tenant_pic: file?.path?.split("src/public")[1],
    });
  }

  async createSchema(
    tenant: Tenant,
    user: TenantUser,
    password: string,
    transaction: Transaction
  ) {
    await this.sequelize.createSchema(tenant.schema_name, {});

    for (const model of Object.values(this.sequelize.models)) {
      if (commonModels.includes(model.name)) {
        await model.schema(tenant.schema_name).sync();
        this.logger.log(
          `Table ${model.name} created for schema ${tenant.schema_name}`
        );
      } else if (![...publicModels].includes(model.name)) {
        if (model.name === "User") {
          await model.schema(tenant.schema_name).sync();
          await this.sequelize.query(getUserTableQuery(tenant.schema_name));
        } else {
          await model.schema(tenant.schema_name).sync();
          this.logger.log(
            `Table ${model.name} created for schema ${tenant.schema_name}`
          );
        }
      }
    }

    const department = await this.department.schema(tenant.schema_name).create(
      {
        name: "Admin Department",
      },
      { transaction }
    );

    const designation = await this.designation
      .schema(tenant.schema_name)
      .create(
        {
          name: "Admin",
        },
        { transaction }
      );

    await this.rater.schema(tenant.schema_name).bulkCreate(
      [
        {
          category_name: "Self",
          name: "Self",
          short_name: "SLF",
          no_of_raters: 1,
          order: 1,
          can_be_deleted: false,
        },
        {
          category_name: "Immediate Supervisor",
          name: "Immediate Supervisor",
          short_name: "IMS",
          no_of_raters: 1,
          order: 2,
          can_be_deleted: true,
          createdAt: moment().subtract(1, "days").format(),
        },
        {
          category_name: "Indirect Supervisor",
          name: "Indirect Supervisor",
          short_name: "IDS",
          no_of_raters: 1,
          order: 3,
          can_be_deleted: true,
          createdAt: moment().subtract(2, "days").format(),
        },
        {
          category_name: "Peers",
          name: "Peers",
          short_name: "PRS",
          no_of_raters: 5,
          order: 4,
          can_be_deleted: true,
          createdAt: moment().subtract(3, "days").format(),
        },
        {
          category_name: "Subordinates",
          name: "Subordinates",
          short_name: "SUBS",
          no_of_raters: 5,
          order: 5,
          can_be_deleted: true,
          createdAt: moment().subtract(4, "days").format(),
        },
        {
          category_name: "Indirect Subordinates",
          name: "Indirect Subordinates",
          short_name: "ISUBS",
          no_of_raters: 3,
          order: 6,
          can_be_deleted: true,
          createdAt: moment().subtract(5, "days").format(),
        },
        {
          category_name: "Stakeholders",
          name: "Stakeholders",
          short_name: "SHS",
          no_of_raters: 3,
          order: 7,
          can_be_deleted: true,
          createdAt: moment().subtract(6, "days").format(),
        },
      ],
      { transaction }
    );

    if (user) {
      await this.sequelize.models["User"].schema(tenant.schema_name).create(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          region: tenant.location,
          password,
          tenant_id: tenant.id,
          department_id: department.id,
          designation_id: designation.id,
          is_tenant_admin: true,
        },
        { transaction }
      );
    }
  }

  async getAllTenants() {
    const data = await this.tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      group: ["Tenant.id", "admin.id", "industry.id"],
      where: {
        is_channel_partner: false,
        ...getSearchObject(this.requestParamsService.query, [
          '"Tenant"."name"',
          '"Tenant"."location"',
          '"Tenant"."admin_type"',
          '"industry"."name"',
          '"admin"."email"',
        ]),
      },
      include: [
        { model: Industry, attributes: ["name"] },
        {
          as: "admin",
          model: TenantUser,
          required: false,
          on: literal('"Tenant"."admin_id" = "admin"."id"'),
          attributes: ["email", "name"],
        },
      ],
      ...this.requestParamsService.pagination,
    });
    const count = await this.tenant.schema(DB_PUBLIC_SCHEMA).count({
      where: {
        is_channel_partner: false,
        ...getSearchObject(this.requestParamsService.query, [
          '"Tenant"."name"',
          '"Tenant"."location"',
          '"Tenant"."admin_type"',
          '"industry"."name"',
          '"admin"."email"',
        ]),
      },
      include: [
        { model: Industry, attributes: ["name"] },
        {
          as: "admin",
          model: TenantUser,
          required: false,
          on: literal('"Tenant"."admin_id" = "admin"."id"'),
          attributes: ["email", "name"],
        },
      ],
    });
    return { count: count, rows: data };
  }

  async getAllChannelPartners() {
    return this.tenant.schema(DB_PUBLIC_SCHEMA).findAndCountAll({
      group: ["Tenant.id", "admin.id", "industry.id"],
      where: {
        is_channel_partner: true,
        ...this.requestParamsService.query,
      },
      include: [
        { model: Industry, attributes: ["name"] },
        {
          as: "admin",
          model: TenantUser,
          required: false,
          on: literal('"Tenant"."admin_id" = "admin"."id"'),
          attributes: ["email", "name"],
        },
      ],
      ...this.requestParamsService.pagination,
    });
  }

  async getSingleTenantDetails(id: string) {
    return this.tenant.schema(DB_PUBLIC_SCHEMA).findOne({
      where: {
        id,
      },
      include: [
        { model: Industry, attributes: ["name"] },
        {
          model: Tenant,
          as: "my_tenants",
          include: [
            { model: Industry, attributes: ["name"] },
            {
              as: "admin",
              model: TenantUser,
              required: false,
              on: literal('"my_tenants"."admin_id" = "my_tenants->admin"."id"'),
              attributes: ["email", "name"],
            },
          ],
        },
        {
          as: "admin",
          model: TenantUser,
          required: false,
          on: literal('"Tenant"."admin_id" = "admin"."id"'),
          attributes: ["email", "name"],
        },
      ],
      ...this.requestParamsService.pagination,
    });
  }

  async migrateData(_: string) {
    // const questions = await Question.schema("yyc").findAll({
    //   where: {
    //     is_copy: true,
    //   },
    //   include: [
    //     {
    //       model: QuestionnaireQuestion,
    //       where: {
    //         questionnaire_id: "e1587e93-f752-4a38-896e-d7269cb7364a",
    //         is_copy: true,
    //       },
    //     },
    //     {
    //       model: QuestionResponse,
    //       where: {
    //         is_copy: true,
    //       },
    //     },
    //   ],
    // });

    // const responses = await SurveyResponse.schema("yyc").findAll({
    //   include: [
    //     {
    //       model: QuestionResponse,
    //       as: "response",
    //       where: {
    //         is_copy: true,
    //         type: QuestionResponseOptions.likert_scale,
    //       },
    //     },
    //     {
    //       model: QuestionResponse,
    //       as: "expected_response",
    //       where: {
    //         is_copy: true,
    //         type: QuestionResponseOptions.likert_scale,
    //       },
    //     },
    //   ],
    // });

    // console.log(responses.length, "\n\n\n\n");

    // for (const response of responses) {
    //   console.count("in side response");
    //   await response.update({
    //     actual_gap: response.expected_response.score - response.response.score,
    //   });
    // }
    const questionnaireQuestions = await QuestionnaireQuestion.schema(
      "epf"
    ).findAll({
      where: {
        is_copy: false,
      },
      include: [
        {
          model: Question,
        },
      ],
    });

    for (const questionnaireQuestion of questionnaireQuestions) {
      const toUpdateQuestionnaire = await QuestionnaireQuestion.schema(
        "epf"
      ).findAll({
        where: {
          is_copy: true,
        },
        include: [
          {
            model: Question,
            where: {
              is_copy: true,
              text: questionnaireQuestion.question.text,
            },
          },
        ],
      });
      toUpdateQuestionnaire.forEach(async (item) => {
        await item.update({
          order: questionnaireQuestion.order,
        });
      });
    }
    // const questionnaireCompetencies = await QuestionnaireCompetency.schema(
    //   "epf"
    // ).findAll({
    //   where: {
    //     is_copy: false,
    //   },
    //   include: [
    //     {
    //       model: Competency,
    //     },
    //   ],
    // });

    // for (const questionnaireCompetency of questionnaireCompetencies) {
    //   const toUpdateQuestionnaire = await QuestionnaireCompetency.schema(
    //     "epf"
    //   ).findAll({
    //     where: {
    //       is_copy: true,
    //     },
    //     include: [
    //       {
    //         model: Competency,
    //         where: {
    //           is_copy: true,
    //           title: questionnaireCompetency.competency.title,
    //         },
    //       },
    //     ],
    //   });
    //   toUpdateQuestionnaire.forEach(async (item) => {
    //     await item.update({
    //       order: questionnaireCompetency.order,
    //     });
    //   });
    // }
    return "done";
  }

  async testMail(body: any) {
    // console.log(body);

    // let Mail = {
    //   to: body.email,
    //   subject: `This is test email`,
    // };
    // this.mailService.TestMail(Mail);

    const surveyDescription = await SurveyDescription.schema("punb").findOne({
      where: {
        id: body.id,
      },
      include: [
        {
          model: Survey,
        },
      ],
    });
    const token = await {
      // id: respondants[index].respondant.id,
      survey_id: surveyDescription?.id,
      schema_name: "punb",
      is_external: false,
    };
    const surveyids = surveyDescription.surveys.map((item) => item.id);
    await this.surveyService.setBenchmark(
      surveyDescription.questionnaire_id,
      token
    );
    await this.nbolSurveyService.setQuestionAvgGap(
      surveyDescription.questionnaire_id,
      token,
      surveyids
    );
    return "Mail Sent Successfully";
  }
}
