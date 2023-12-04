import { NotFoundException } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { literal } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { getSearchObject } from "src/common/helpers";
import { RequestParamsService } from "src/common/modules";
import { Competency } from "src/modules/competencies/models";
import {
  Question,
  QuestionAreaAssessment,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { StandardCompetency } from "src/modules/competencies/modules/standardCompetency/models";
import {
  StandardQuestion,
  StandardQuestionAreaAssessment,
  StandardQuestionResponse,
} from "src/modules/competencies/modules/standardCompetency/modules/standardQuestions/models";
import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";
import { Industry } from "src/modules/settings/modules/industry/models";
import { TenantsService } from "src/modules/tenants/app/tenants.service";
import { CreateTenant } from "src/modules/tenants/dtos";
import { UpdateTenant } from "src/modules/tenants/dtos/updateTenant.dto";
import { Tenant, TenantMetaData, TenantUser } from "src/modules/tenants/models";

export class ChannelPartnerService {
  constructor(
    @InjectModel(Tenant) private readonly tenant: typeof Tenant,
    @InjectModel(AreaAssessment)
    private readonly areaAssessment: typeof AreaAssessment,
    @InjectModel(StandardCompetency)
    private readonly standardCompetency: typeof StandardCompetency,
    @InjectModel(Competency)
    private readonly competency: typeof Competency,
    @InjectModel(Question)
    private readonly question: typeof Question,
    @InjectModel(QuestionResponse)
    private readonly questionResponse: typeof QuestionResponse,
    @InjectModel(QuestionAreaAssessment)
    private readonly questionAreaAssessment: typeof QuestionAreaAssessment,
    private readonly requestParams: RequestParamsService,
    private readonly tenantService: TenantsService,
    @InjectConnection() private readonly sequelize: Sequelize
  ) {}

  async getAllTenants() {
    const data = await this.tenant.schema(DB_PUBLIC_SCHEMA).findAll<Tenant>({
      group: ["Tenant.id", "admin.id", "industry.id"],
      where: {
        parent_tenant_id: [
          this.requestParams.tenant.id,
          this.requestParams.tenant.parent_tenant_id,
        ],
        ...getSearchObject(this.requestParams.query, [
          '"Tenant"."name"',
          "schema_name",
        ]),
      },
      ...this.requestParams.pagination,
      include: [
        {
          as: "admin",
          model: TenantUser,
          required: false,
          on: literal('"Tenant"."admin_id" = "admin"."id"'),
          attributes: ["email", "name"],
        },
        {
          model: Industry,
          required: false,
          attributes: ["id", "name"],
        },
      ],
    });
    const count = await this.tenant.schema(DB_PUBLIC_SCHEMA).count({
      where: {
        parent_tenant_id: [
          this.requestParams.tenant.id,
          this.requestParams.tenant.parent_tenant_id,
        ],
        ...getSearchObject(this.requestParams.query, [
          '"Tenant"."name"',
          "schema_name",
        ]),
      },
    });
    return { rows: data, count };
  }

  async getSingleTenant(id: string) {
    const tenant = await this.tenant
      .schema(DB_PUBLIC_SCHEMA)
      .findByPk<Tenant>(id, {
        include: [
          {
            as: "admin",
            model: TenantUser,
            on: literal('"Tenant"."admin_id" = "admin"."id"'),
            attributes: ["email", "name"],
          },
          { model: Industry, attributes: ["id", "name"] },
          { model: TenantMetaData, attributes: ["id", "response_form"] },
        ],
      });
    if (!tenant) {
      throw new NotFoundException(`tenant not found`);
    }
    return tenant;
  }

  async createTenant(body: CreateTenant) {
    body.tenant.parent_tenant_id = this.requestParams.tenant.id;
    const tenant = await this.tenantService.createTenant(body);
    const areaAssessment = JSON.parse(
      JSON.stringify(
        await this.areaAssessment.schema(DB_PUBLIC_SCHEMA).findAll({
          where: {
            tenant_id: this.requestParams.tenant.id,
          },
        })
      )
    );

    let areaAssessmentsIds = areaAssessment.map((item) => item.id);
    const competenciesFromDB = JSON.parse(
      JSON.stringify(
        await this.standardCompetency.schema(DB_PUBLIC_SCHEMA).findAll({
          where: {
            tenant_id: this.requestParams.tenant.id,
          },
          include: {
            model: StandardQuestion,
            include: [
              { model: StandardQuestionResponse },
              { model: StandardQuestionAreaAssessment },
            ],
          },
        })
      )
    );
    const transaction = await this.sequelize.transaction();

    try {
      this.areaAssessment
        .schema(tenant.schema_name)
        .bulkCreate(areaAssessment, { transaction });

      let competencies = [];
      let questions = [];
      let questionResponses = [];
      let questionAreaAssessments = [];

      for (const competency of competenciesFromDB) {
        competencies.push({ ...competency, questions: undefined });
        if (competency.questions.length) {
          for (const question of competency.questions) {
            questions.push({
              ...question,
              responses: undefined,
              questionAreaAssessment: undefined,
            });

            for (const questionResponse of question.responses) {
              questionResponses.push({ ...questionResponse });
            }
            for (const areaAssessment of question.questionAreaAssessment) {
              if (
                areaAssessmentsIds.includes(areaAssessment.area_assessment_id)
              ) {
                questionAreaAssessments.push({ ...areaAssessment });
              }
            }
          }
        }
      }

      await this.competency
        .schema(tenant.schema_name)
        .bulkCreate(competencies, { transaction });
      await this.question
        .schema(tenant.schema_name)
        .bulkCreate(questions, { transaction });
      await this.questionResponse
        .schema(tenant.schema_name)
        .bulkCreate(questionResponses, { transaction });
      await this.questionAreaAssessment
        .schema(tenant.schema_name)
        .bulkCreate(questionAreaAssessments, { transaction });
      await transaction.commit();
      return tenant;
    } catch (error) {
      await this.sequelize.dropSchema(tenant.schema_name, {});
      await transaction.rollback();
      await tenant.destroy();
      throw error;
    }
  }

  async updateTenant(id: string, body: UpdateTenant) {
    const tenant = await this.getSingleTenant(id);
    if (!tenant) {
      throw new NotFoundException(`tenant not found`);
    }

    if (tenant.parent_tenant_id !== this.requestParams.tenant.id) {
      throw new NotFoundException(`tenant not found`);
    }
    const newTenant = await this.tenantService.updateTenant(id, body);

    return newTenant;
  }

  async deleteTenant(id: string) {
    const tenant = await this.getSingleTenant(id);
    if (!tenant) {
      throw new NotFoundException(`tenant not found`);
    }

    if (tenant.parent_tenant_id !== this.requestParams.tenant.id) {
      throw new NotFoundException(`tenant not found`);
    }
    const newTenant = await this.tenantService.deleteTenant(id);

    return newTenant;
  }
}
