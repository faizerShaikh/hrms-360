/*
https://docs.nestjs.com/providers#services
*/

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
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
    @InjectModel(TenantHistory) private tenantHistory: typeof TenantHistory
  ) {}

  async createCompetency(body: createCompetencyDTO) {
    const isCompetencyExist = await this.standardCompetency
      .schema(DB_PUBLIC_SCHEMA)
      .findOne<StandardCompetency>({
        where: {
          title: body.title,
          tenant_id: this.requestParams.tenant.id,
        },
      });

    if (isCompetencyExist)
      throw new BadRequestException(
        "Competency with this title already exists"
      );
    const tenants = await this.tenant.schema(DB_PUBLIC_SCHEMA).findAll<Tenant>({
      where: {
        parent_tenant_id: this.requestParams.tenant.id,
      },
      attributes: ["schema_name", "id"],
    });
    const competencyCount = await this.standardCompetency.count();
    const competency: StandardCompetency = await this.standardCompetency
      .schema(DB_PUBLIC_SCHEMA)
      .create(
        {
          ...body,
          type: CompetencyTypeOptions.standard,
          order: competencyCount + 1,
          tenant_id: this.requestParams.tenant.id,
        },
        { transaction: this.requestParams.transaction }
      );

    for (const tenant of tenants) {
      await this.competency.schema(tenant.schema_name).create<Competency>(
        {
          ...body,
          type: CompetencyTypeOptions.standard,
          order: competencyCount + 1,
          id: competency.id,
        },
        { transaction: this.requestParams.transaction }
      );
    }

    await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).create(
      {
        type: TenantHistoryTypes.competency,
        reference_id: competency.id,
        tenant_id: this.requestParams.tenant.id,
        group: TenantHistoryGroup.competency,
      },
      { transaction: this.requestParams.transaction }
    );

    return competency;
  }

  async updateCompetency(body: UpdateCompetencyDTO, id: string) {
    const isCompetencyExist = await this.standardCompetency
      .schema(DB_PUBLIC_SCHEMA)
      .findOne<StandardCompetency>({
        where: {
          title: body.title,
          tenant_id: this.requestParams.tenant.id,
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
    await competency.update(
      { ...body },
      { transaction: this.requestParams.transaction }
    );

    const tenants = await this.tenant.schema(DB_PUBLIC_SCHEMA).findAll<Tenant>({
      where: {
        parent_tenant_id: this.requestParams.tenant.id,
      },
      attributes: ["schema_name", "id"],
    });

    for (const tenant of tenants) {
      await this.competency.schema(tenant.schema_name).update<Competency>(
        {
          ...body,
        },
        { where: { id }, transaction: this.requestParams.transaction }
      );
    }

    return competency;
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
      .unscoped()
      .findAndCountAll<StandardCompetency>({
        order: [["order", "ASC"]],
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
            "order",
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
                    through: { attributes: [] },
                    required: false,
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
    const competency = await this.findOneCompetency(id, false);
    await competency.destroy({ transaction: this.requestParams.transaction });
    await this.standardCompetency.schema(DB_PUBLIC_SCHEMA).decrement(
      { order: 1 },
      {
        where: {
          order: {
            [Op.gt]: competency.order,
          },
        },
      }
    );
    const tenants = await this.tenant.schema(DB_PUBLIC_SCHEMA).findAll<Tenant>({
      where: {
        parent_tenant_id: this.requestParams.tenant.id,
      },
      attributes: ["schema_name", "id"],
    });

    for (const tenant of tenants) {
      await this.competency.schema(tenant.schema_name).destroy({
        where: { id },
        transaction: this.requestParams.transaction,
      });
      await this.competency.schema(tenant.schema_name).decrement(
        { order: 1 },
        {
          where: {
            order: {
              [Op.gt]: competency.order,
            },
          },
        }
      );
    }

    await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).destroy({
      where: { reference_id: id },
      transaction: this.requestParams.transaction,
    });

    return competency;
  }

  // async manageOrder<T extends {} = any>(dto: any): Promise<T | any> {
  //   const question = await this.standardCompetency
  //     .schema(DB_PUBLIC_SCHEMA)
  //     .findOne({
  //       where: {
  //         id: dto?.id,
  //       },
  //     });
  //   const tenants = await this.tenant.schema(DB_PUBLIC_SCHEMA).findAll<Tenant>({
  //     where: {
  //       parent_tenant_id: this.requestParams.tenant.id,
  //       is_channel_partner: false,
  //     },
  //   });

  //   for (const tenant of tenants) {
  //     const tenantquestion = await this.competency
  //       .schema(tenant.schema_name)
  //       .findOne({
  //         where: {
  //           is_copy: false,
  //           id: dto?.id,
  //         },
  //       });
  //     if (dto?.orderType === "promote") {
  //       await this.competency.schema(tenant.schema_name).update(
  //         { order: question?.order },
  //         {
  //           where: {
  //             order: question?.order - 1,
  //             is_copy: false,
  //           },
  //         }
  //       );

  //       await tenantquestion.update({ order: question?.order - 1 });
  //     }

  //     if (dto?.orderType === "demote") {
  //       console.log(question, "<=====questionrrrrrr", question?.order - 1);

  //       await this.competency.schema(tenant.schema_name).update(
  //         { order: question?.order },
  //         {
  //           where: {
  //             order: question?.order + 1,
  //             is_copy: false,
  //           },
  //         }
  //       );

  //       await tenantquestion.update({ order: question?.order + 1 });
  //     }
  //   }
  //   if (dto?.orderType === "promote") {
  //     await this.standardCompetency
  //       .schema(DB_PUBLIC_SCHEMA)
  //       .update(
  //         { order: question?.order },
  //         { where: { order: question?.order - 1 } }
  //       );

  //     return await question.update({ order: question?.order - 1 });
  //   }

  //   if (dto?.orderType === "demote") {
  //     console.log(question, "<=====questionrrrrrr DEMOTE", question?.order + 1);

  //     await this.standardCompetency
  //       .schema(DB_PUBLIC_SCHEMA)
  //       .update(
  //         { order: question?.order },
  //         { where: { order: question?.order + 1 } }
  //       );

  //     return await question.update({ order: question?.order + 1 });
  //   }
  // }
}
