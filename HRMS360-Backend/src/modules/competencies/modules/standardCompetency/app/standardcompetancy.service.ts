/*
https://docs.nestjs.com/providers#services
*/

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import {
  commonAttrubutesToExclude,
  DB_PUBLIC_SCHEMA,
} from "src/common/constants";
import { getSearchObject } from "src/common/helpers";
import { RequestParamsService } from "src/common/modules";
import { UpdateCompetencyDTO } from "src/modules/competencies/dtos";
import { createCompetencyDTO } from "src/modules/competencies/dtos/createCompetency.dto";
import { Competency } from "src/modules/competencies/models";
import { CompetencyTypeOptions } from "src/modules/competencies/types";

import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";
import { Tenant, TenantHistory } from "src/modules/tenants/models";
import {
  TenantHistoryGroup,
  TenantHistoryTypes,
} from "src/modules/tenants/types";
import { StandardCompetency } from "../models";
import {
  StandardQuestion,
  StandardQuestionResponse,
} from "../modules/standardQuestions/models";

@Injectable()
export class StandardCompetancyService {
  constructor(
    @InjectModel(Competency)
    private readonly competency: typeof Competency,
    @InjectModel(StandardCompetency)
    private readonly standardCompetency: typeof StandardCompetency,
    @InjectModel(Tenant) private readonly tenant: typeof Tenant,
    private readonly requestParams: RequestParamsService,
    @InjectModel(TenantHistory) private tenantHistory: typeof TenantHistory,
    @InjectConnection() private readonly sequelize: Sequelize
  ) {}

  async createCompetency(body: createCompetencyDTO) {
    const transaction = await this.sequelize.transaction();
    try {
      const isCompetencyExist = await this.standardCompetency
        .schema(DB_PUBLIC_SCHEMA)
        .findOne<StandardCompetency>({
          where: {
            title: body.title,
          },
        });

      if (isCompetencyExist)
        throw new BadRequestException(
          "Competency with this title already exists"
        );
      const tenants = await this.tenant
        .schema(DB_PUBLIC_SCHEMA)
        .unscoped()
        .findAll<Tenant>({
          where: {
            parent_tenant_id: this.requestParams.tenant.id,
          },
          paranoid: false,
          attributes: ["schema_name", "id"],
        });

      const competency: StandardCompetency = await this.standardCompetency
        .schema(DB_PUBLIC_SCHEMA)
        .create(
          {
            ...body,
            type: CompetencyTypeOptions.standard,
            tenant_id: this.requestParams.tenant.id,
          },
          { transaction }
        );

      for (const tenant of tenants) {
        await this.competency.schema(tenant.schema_name).create<Competency>(
          {
            ...body,
            type: CompetencyTypeOptions.standard,
            id: competency.id,
          },
          { transaction }
        );
      }

      await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).create(
        {
          type: TenantHistoryTypes.competency,
          reference_id: competency.id,
          tenant_id: this.requestParams.tenant.id,
          group: TenantHistoryGroup.competency,
        },
        { transaction }
      );

      await transaction.commit();
      return competency;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateCompetency(body: UpdateCompetencyDTO, id: string) {
    const transaction = await this.sequelize.transaction();
    try {
      const isCompetencyExist = await this.standardCompetency
        .schema(DB_PUBLIC_SCHEMA)
        .findOne<StandardCompetency>({
          where: {
            title: body.title,
            id: {
              [Op.ne]: id,
            },
          },
        });

      if (isCompetencyExist)
        throw new BadRequestException(
          "Competency with this title already exists"
        );

      const competency = await this.findOneCompetency(id, false);
      await competency.update({ ...body }, { transaction });

      const tenants = await this.tenant
        .schema(DB_PUBLIC_SCHEMA)
        .findAll<Tenant>({
          where: {
            parent_tenant_id: this.requestParams.tenant.id,
          },
          paranoid: false,
          attributes: ["schema_name", "id"],
        });

      for (const tenant of tenants) {
        await this.competency.schema(tenant.schema_name).update<Competency>(
          {
            ...body,
          },
          { where: { id }, transaction }
        );
      }
      await transaction.commit();
      return competency;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAllCompetencyByType(type: string) {
    return this.standardCompetency
      .schema(DB_PUBLIC_SCHEMA)
      .findAndCountAll<StandardCompetency>({
        where: {
          type,
          ...getSearchObject(this.requestParams.query, [
            "title",
            "description",
          ]),
        },
        ...this.requestParams.pagination,
      });
  }

  async getAllCompetency() {
    return this.standardCompetency
      .schema(DB_PUBLIC_SCHEMA)
      .findAndCountAll<StandardCompetency>({
        where: {
          tenant_id: this.requestParams.tenant.id,

          ...getSearchObject(this.requestParams.query, [
            "title",
            "description",
          ]),
        },
        ...this.requestParams.pagination,
      });
  }

  async findOneCompetency(id?: string, isJoin: boolean = true) {
    const competency = await this.standardCompetency
      .schema(DB_PUBLIC_SCHEMA)
      .findOne<StandardCompetency>({
        where: {
          id,
        },
        order: isJoin && [
          [
            {
              model: StandardQuestion,
              as: "questions",
            },
            "text",
            "ASC",
          ],
          [
            {
              model: StandardQuestion,
              as: "questions",
            },
            {
              model: StandardQuestionResponse,
              as: "responses",
            },
            "order",
            "ASC",
          ],
        ],
        include: isJoin
          ? [
              {
                model: StandardQuestion,
                required: false,
                attributes: commonAttrubutesToExclude,
                include: [
                  {
                    model: StandardQuestionResponse,
                    attributes: commonAttrubutesToExclude,
                  },
                  {
                    model: AreaAssessment,
                    attributes: commonAttrubutesToExclude,
                  },
                ],
              },
            ]
          : [],
      });

    if (!competency) {
      throw new NotFoundException("Competency not found");
    }

    return competency;
  }

  async deleteCompetency(id: string) {
    const transaction = await this.sequelize.transaction();
    try {
      const competency = await this.findOneCompetency(id, false);
      await competency.destroy({ transaction });

      const tenants = await this.tenant
        .schema(DB_PUBLIC_SCHEMA)
        .findAll<Tenant>({
          where: {
            parent_tenant_id: this.requestParams.tenant.id,
          },
          paranoid: false,
          attributes: ["schema_name", "id"],
        });

      for (const tenant of tenants) {
        await this.competency
          .schema(tenant.schema_name)
          .destroy({ where: { id }, transaction });
      }

      await this.tenantHistory
        .schema(DB_PUBLIC_SCHEMA)
        .destroy({ where: { reference_id: id }, transaction });

      await transaction.commit();
      return competency;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
