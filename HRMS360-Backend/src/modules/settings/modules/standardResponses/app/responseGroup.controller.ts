import { Controller } from "@nestjs/common";
import { GenericController } from "src/modules/generics/app/generics.controller";
import { CreateResponseGroupDTO, UpdateResponseGrpoupDTO } from "../dtos";
import { ResponseGroupService } from "./responseGroup.service";

@Controller("setting/response-group")
export class ResponseGroupController extends GenericController {
  constructor(private readonly responseGroupService: ResponseGroupService) {
    super(responseGroupService, {
      createDTO: CreateResponseGroupDTO,
      updateDTO: UpdateResponseGrpoupDTO,
    });
  }
}
