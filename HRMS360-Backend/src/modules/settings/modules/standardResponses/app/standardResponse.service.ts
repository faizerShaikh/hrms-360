import { BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { RequestParamsService } from "src/common/modules";
import { CreateStandardResponse, UpdateStandardResponse } from "../dtos";
import { StandardResponse } from "../models";

export class StandardResponseService {
  constructor(
    @InjectModel(StandardResponse)
    private readonly standardResponse: typeof StandardResponse,
    private readonly requestParams: RequestParamsService
  ) {}

  async createStandardResponse(dto: CreateStandardResponse) {
    const found = await this.standardResponse
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          [Op.or]: [
            {
              label: dto.label,
            },
            {
              score: dto.score,
            },
          ],
          group_id: dto.group_id,
        },
      });

    if (found)
      throw new BadRequestException(
        "Standard Response with this score already exists!"
      );

    return this.standardResponse
      .schema(this.requestParams.schema_name)
      .create({ ...dto, type: "likert_scale" });
  }

  async updateStandardResponse(dto: UpdateStandardResponse, id?: string) {
    const found = await this.standardResponse
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          [Op.or]: [
            {
              label: dto.label,
            },
            {
              score: dto.score,
            },
          ],
          group_id: dto.group_id,
          id: { [Op.ne]: id },
        },
      });

    if (found)
      throw new BadRequestException(
        "Standard Response with this score already exists!"
      );

    await this.standardResponse
      .schema(this.requestParams.schema_name)
      .update({ ...dto, type: "likert_scale" }, { where: { id } });
  }

  async getStandardResponses(group_id: string) {
    return this.standardResponse
      .schema(this.requestParams.schema_name)
      .findAndCountAll({
        where: {
          group_id,
          ...this.requestParams.query,
        },
        ...this.requestParams.pagination,
        distinct: true,
      });
  }

  async deleteStandardResponse(id: string) {
    const found = await this.standardResponse
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          id,
        },
      });

    if (found) throw new BadRequestException("Standard Response not found");

    await found.destroy();
    return "Standard Response deleted successfully";
  }
}
