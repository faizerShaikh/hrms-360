import { Injectable } from "@nestjs/common";
import { RequestParamsService } from "src/common/modules";
import { GenericsService } from "src/modules/generics/app/generics.service";
import { DesignationDTO } from "../dtos/department.dto";
import { Designation } from "../models";

@Injectable()
export class DesignationService extends GenericsService<
  DesignationDTO,
  DesignationDTO
> {
  constructor(private readonly requestParams: RequestParamsService) {
    super(Designation.schema(requestParams.schema_name), {
      requestParams,
      searchFields: ["name"],
    });
  }
}
