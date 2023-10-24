import { Controller } from "@nestjs/common";
import { GenericController } from "src/modules/generics/app/generics.controller";
import { DepartmentDTO } from "../dtos/department.dto";
import { DepartmentService } from "./department.service";

@Controller("setting/department")
export class DepartmentController extends GenericController {
  constructor(private readonly departmentService: DepartmentService) {
    super(departmentService, {
      createDTO: DepartmentDTO,
      updateDTO: DepartmentDTO,
    });
  }
}
