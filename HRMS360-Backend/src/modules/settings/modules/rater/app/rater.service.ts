import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { RequestParamsService } from "src/common/modules";
import { GenericsService } from "src/modules/generics/app/generics.service";
import { Rater } from "../models";

@Injectable()
export class RaterService extends GenericsService {
  constructor(
    private readonly requestParams: RequestParamsService,
    @InjectModel(Rater) private readonly rater: typeof Rater
  ) {
    super(Rater.schema(requestParams.schema_name), {
      requestParams,
      searchFields: ["category_name"],
      defaultWhere: {
        survey_description_id: null,
        category_name: {
          [Op.ne]: "Self",
        },
      },
    });
  }

  async create<T extends {} = any>(dto: any): Promise<T> {
    dto.name = dto.category_name;
    const rater = await this.rater
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          category_name: dto.category_name,
          survey_description_id: null,
        },
      });

    if (rater) {
      throw new BadRequestException("Category with this name already exits");
    }
    return super.create(dto);
  }

  async update<T extends {} = any>(dto: any, id?: string): Promise<T> {
    const rater = await this.rater
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          category_name: dto.category_name,
          survey_description_id: null,
          id: {
            [Op.ne]: id,
          },
        },
      });

    if (rater) {
      throw new BadRequestException("Category with this name already exits");
    }
    return super.update(dto, id);
  }
}
