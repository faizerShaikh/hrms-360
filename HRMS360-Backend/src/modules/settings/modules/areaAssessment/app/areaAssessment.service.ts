import { Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { Sequelize } from "sequelize-typescript";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { getSearchObject } from "src/common/helpers";
import { RequestParamsService } from "src/common/modules";
import { GenericsService } from "src/modules/generics/app/generics.service";
import { Tenant } from "src/modules/tenants/models";
import { CreateAreaAssessmentDTO, UpdateAreaAssessmentDTO } from "../dtos";
import { AreaAssessment } from "../models";

@Injectable()
export class AreaAssessmentService extends GenericsService {
  constructor(
    @InjectModel(AreaAssessment)
    private readonly areaAssessment: typeof AreaAssessment,
    @InjectModel(Tenant)
    private readonly tenant: typeof Tenant,
    private readonly requestParams: RequestParamsService,
    @InjectConnection() private readonly sequelize: Sequelize
  ) {
    super(AreaAssessment.schema(requestParams.schema_name), {
      requestParams,
      searchFields: ["name"],
    });
  }

  create<T extends {} = any>(dto: any): Promise<T> {
    dto.tenant_id = this.reqParam.tenant.id;
    return super.create(dto);
  }

  update<T extends {} = any>(dto: any, id?: string): Promise<T> {
    dto.tenant_id = this.reqParam.tenant.id;
    return super.update(dto, id);
  }

  async createStandardAreaAssessment(body: CreateAreaAssessmentDTO) {
    const tenants = await this.tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      where: {
        parent_tenant_id: this.requestParams.tenant.id,
      },
      attributes: ["schema_name", "id"],
    });

    const transaction = await this.sequelize.transaction();
    try {
      const areaAssessment = await this.areaAssessment
        .schema(DB_PUBLIC_SCHEMA)
        .create(
          {
            ...body,
            tenant_id: this.requestParams.tenant.id,
          },
          { transaction }
        );
      for (const tenant of tenants) {
        await this.areaAssessment
          .schema(tenant.schema_name)
          .create({ ...body, id: areaAssessment.id }, { transaction });
      }
      await transaction.commit();
      return areaAssessment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  async findAllStandardAreaAssessment() {
    const areaAssessments = await this.areaAssessment
      .schema(DB_PUBLIC_SCHEMA)
      .findAndCountAll({
        where: {
          tenant_id: this.requestParams.tenant.id,
          ...getSearchObject(
            this.requestParams.query,
            this.options.searchFields
          ),
        },
        ...this.requestParams.pagination,
        distinct: true,
      });

    return areaAssessments;
  }

  async updateStandardAreaAssessment(
    body: UpdateAreaAssessmentDTO,
    id: string
  ) {
    const tenants = await this.tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      where: {
        parent_tenant_id: this.requestParams.tenant.id,
      },
      attributes: ["schema_name", "id"],
    });
    const transaction = await this.sequelize.transaction();
    try {
      await this.areaAssessment.schema(DB_PUBLIC_SCHEMA).update(
        {
          ...body,
        },
        {
          where: {
            id,
          },
          transaction,
        }
      );
      for (const tenant of tenants) {
        await this.areaAssessment
          .schema(tenant.schema_name)
          .update({ ...body }, { where: { id }, transaction });
      }
      await transaction.commit();
      return "Area assessment updated successfully";
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteStandardAreaAssessment(id: string) {
    const tenants = await this.tenant.schema(DB_PUBLIC_SCHEMA).findAll({
      where: {
        parent_tenant_id: this.requestParams.tenant.id,
      },
      attributes: ["schema_name", "id"],
    });

    const transaction = await this.sequelize.transaction();
    try {
      await this.areaAssessment
        .schema(DB_PUBLIC_SCHEMA)
        .destroy({ where: { id }, transaction });

      for (const tenant of tenants) {
        await this.areaAssessment
          .schema(tenant.schema_name)
          .update({ is_deleted: true }, { where: { id }, transaction });
      }
      await transaction.commit();
      return "Area assessment deleted successfully";
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
