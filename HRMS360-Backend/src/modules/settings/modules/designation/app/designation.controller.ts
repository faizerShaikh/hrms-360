import { Controller } from "@nestjs/common";
import { GenericController } from "src/modules/generics/app/generics.controller";
import { DesignationDTO } from "../dtos/department.dto";
import { DesignationService } from "./designation.service";

@Controller("setting/designation")
export class DesignationController extends GenericController {
  constructor(private readonly designationSevice: DesignationService) {
    super(designationSevice, {
      createDTO: DesignationDTO,
      updateDTO: DesignationDTO,
    });
  }
}
