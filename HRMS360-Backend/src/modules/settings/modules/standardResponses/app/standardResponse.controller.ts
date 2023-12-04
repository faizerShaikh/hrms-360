import { Controller } from "@nestjs/common";

import { GenericController } from "src/modules/generics/app/generics.controller";
import { CreateStandardResponse, UpdateStandardResponse } from "../dtos";
import { StandardResponseService } from "./standardResponse.service";

@Controller("setting/standard-response")
export class StandardResponseController extends GenericController {
  constructor(
    private readonly standardResponseService: StandardResponseService
  ) {
    super(standardResponseService, {
      createDTO: CreateStandardResponse,
      updateDTO: UpdateStandardResponse,
    });
  }
}
