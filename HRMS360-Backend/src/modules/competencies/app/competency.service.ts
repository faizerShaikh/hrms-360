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
import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";
import { TenantHistory } from "src/modules/tenants/models";
import {
  TenantHistoryGroup,
  TenantHistoryTypes,
} from "src/modules/tenants/types";
import { UpdateCompetencyDTO } from "../dtos";
import { createCompetencyDTO } from "../dtos/createCompetency.dto";
import { getByIdsDTO } from "../dtos/getByIds.dto";
import { Competency } from "../models";
import { Question, QuestionResponse } from "../modules/questions/models";
import { CompetencyTypeOptions } from "../types";

@Injectable()
export class CompetencyService {
  constructor(
    @InjectModel(Competency)
    private readonly competency: typeof Competency,
    @InjectModel(TenantHistory) private tenantHistory: typeof TenantHistory,
    private reqParamsService: RequestParamsService
  ) {}

  async createCompetency(body: createCompetencyDTO) {
    const isCompetencyExist = await this.competency
      .schema(this.reqParamsService.schema_name)
      .findOne<Competency>({
        where: {
          title: body.title,
          is_copy: false,
          type: CompetencyTypeOptions.custom,
        },
      });

    if (isCompetencyExist)
      throw new BadRequestException(
        "Competency with this title already exists"
      );

    const competency = await this.competency
      .schema(this.reqParamsService.schema_name)
      .create<Competency>({
        ...body,
        type: CompetencyTypeOptions.custom,
      });

    await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).create({
      type: TenantHistoryTypes.competency,
      reference_id: competency.id,
      tenant_id: this.reqParamsService.tenant.id,
      group: TenantHistoryGroup.competency,
    });

    return competency;
  }

  async updateCompetency(body: UpdateCompetencyDTO, id: string) {
    const isCompetencyExist = await this.competency
      .schema(this.reqParamsService.schema_name)
      .findOne<Competency>({
        where: {
          title: body.title,
          type: CompetencyTypeOptions.custom,
          is_copy: false,
          id: {
            [Op.ne]: id,
          },
        },
      });

    if (isCompetencyExist)
      throw new BadRequestException(
        "Competency with this title already exists"
      );

    const competency = await this.findOneCompetency(id);

    await competency.update({ ...body });
    return competency;
  }

  async getAllCompetencyByType(type: string) {
    return this.competency
      .schema(this.reqParamsService.schema_name)
      .findAndCountAll<Competency>({
        where: {
          type,
          ...getSearchObject(this.reqParamsService.query, [
            "title",
            "description",
          ]),
        },
        ...this.reqParamsService.pagination,
      });
  }

  async getAllCompetencyByIds(body: getByIdsDTO) {
    return this.competency
      .schema(this.reqParamsService.schema_name)
      .findAll<Competency>({
        where: {
          id: body.ids,
        },
      });
  }

  async getAllCompetency(is_questions: boolean) {
    var competency;
    if (is_questions) {
      competency = await this.competency
        .schema(this.reqParamsService.schema_name)
        .unscoped()
        .findAndCountAll<Competency>({
          order: [["order", "ASC"]],
          where: {
            ...getSearchObject(this.reqParamsService.query, [
              "title",
              "description",
            ]),
            is_copy: false,
            no_of_questions: {
              [Op.gt]: 0,
            },
          },
          ...this.reqParamsService.pagination,
        });
    } else {
      competency = await this.competency
        .schema(this.reqParamsService.schema_name)
        .findAndCountAll<Competency>({
          where: {
            ...getSearchObject(this.reqParamsService.query, [
              "title",
              "description",
            ]),
            no_of_questions: {
              [Op.gt]: 0,
            },
          },
          ...this.reqParamsService.pagination,
        });
    }
    console.log(competency, "competency");

    return competency;
  }

  async findOneCompetency(id?: string) {
    const competency = await this.competency
      .schema(this.reqParamsService.schema_name)
      .findOne<Competency>({
        where: {
          id,
        },
        order: [
          [
            {
              model: Question,
              as: "questions",
            },
            "createdAt",
            "ASC",
          ],
          [
            {
              model: Question,
              as: "questions",
            },
            {
              model: QuestionResponse,
              as: "responses",
            },
            "order",
            "ASC",
          ],
        ],
        include: [
          {
            model: Question,
            required: false,
            attributes: commonAttrubutesToExclude,
            include: [
              {
                model: QuestionResponse,
                required: false,
                attributes: commonAttrubutesToExclude,
              },
              {
                model: AreaAssessment,
                required: false,
                attributes: commonAttrubutesToExclude,
                through: { attributes: [] },
              },
            ],
          },
        ],
      });

    if (!competency) {
      throw new NotFoundException("Competency not found");
    }

    return competency;
  }

  async deleteCompetency(id: string) {
    const competency = await this.findOneCompetency(id);
    // if (competency.type === CompetencyTypeOptions.standard)
    //   throw new BadRequestException(
    //     "Can't delete competency as it is 'Standard Competency'"
    //   );

    await competency.destroy();

    await this.tenantHistory
      .schema(DB_PUBLIC_SCHEMA)
      .destroy({ where: { reference_id: id } });
    return "Competency deleted successfully";
  }
}
