import { BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { RequestParamsService } from "src/common/modules";
import { QuestionResponse } from "src/modules/competencies/modules/questions/models";
import { GenericsService } from "src/modules/generics/app/generics.service";
import { CreateStandardResponse, UpdateStandardResponse } from "../dtos";

export class StandardResponseService extends GenericsService {
  constructor(
    @InjectModel(QuestionResponse)
    private readonly questionResponse: typeof QuestionResponse,
    private readonly requestParams: RequestParamsService
  ) {
    super(QuestionResponse.schema(requestParams.schema_name), {
      defaultWhere: {
        is_standard: true,
      },
      requestParams,
      searchFields: ["label"],
    });
  }

  async create<T extends {} = any>(dto: CreateStandardResponse): Promise<T> {
    const found = await this.questionResponse
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          score: dto.score,
          is_standard: true,
        },
      });

    if (found)
      throw new BadRequestException(
        "Standard Response with this score already exists!"
      );

    return super.create(dto);
  }

  async update<T extends {} = any>(
    dto: UpdateStandardResponse,
    id?: string
  ): Promise<T> {
    const found = await this.questionResponse
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          score: dto.score,
          is_standard: true,
          id: { [Op.ne]: id },
        },
      });

    if (found)
      throw new BadRequestException(
        "Standard Response with this score already exists!"
      );

    return super.create(dto);
  }
}
