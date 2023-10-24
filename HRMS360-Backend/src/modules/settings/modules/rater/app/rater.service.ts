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
        // category_name: {
        //   [Op.ne]: "Self",
        // },
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
    const rater_order = await this.rater
      .schema(this.requestParams.schema_name)
      .count({
        where: {
          survey_description_id: null,
        },
      });
    dto.order = rater_order + 1;
    // var colors = [
    //   "#FEBD2A",
    //   "#29AF7F",
    //   "#260F99",
    //   "#BEC8D0",
    //   "#8B0AA5",
    //   "#A0DA39",
    //   "#FF7F00",
    //   "#2C85B2",
    //   "#19B2FF",
    //   "#8F7EE5",
    // ];
    // dto.color = colors[rater_order + 1];
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

  async manageOrder<T extends {} = any>(dto: any): Promise<T | any> {
    const rater = await this.rater
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          survey_description_id: null,

          id: dto?.id,
        },
      });

    if (dto?.orderType === "promote") {
      await this.rater
        .schema(this.requestParams?.schema_name)
        .update(
          { order: rater?.order },
          { where: { order: rater?.order - 1, survey_description_id: null } }
        );

      return await rater.update({ order: rater?.order - 1 });
    }

    if (dto?.orderType === "demote") {

      await this.rater
        .schema(this.requestParams?.schema_name)
        .update(
          { order: rater?.order },
          { where: { order: rater?.order + 1, survey_description_id: null } }
        );

      return await rater.update({ order: rater?.order + 1 });
    }
  }
}
