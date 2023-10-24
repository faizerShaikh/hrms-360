import { Injectable } from "@nestjs/common";
import { RequestParamsService } from "src/common/modules";
import { GenericsService } from "src/modules/generics/app/generics.service";
import { User } from "src/modules/users/models";
import { DepartmentDTO } from "../dtos/department.dto";
import { Department } from "../models";

@Injectable()
export class DepartmentService extends GenericsService<
  DepartmentDTO,
  DepartmentDTO
> {
  constructor(private readonly requestParams: RequestParamsService) {
    super(Department.schema(requestParams.schema_name), {
      include: { model: User },
      requestParams,
      searchFields: ['"Department"."name"'],
    });
  }
}
