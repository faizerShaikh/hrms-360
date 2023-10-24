import { Controller, HttpCode, HttpStatus, Put } from "@nestjs/common";
import { methodOptions } from "src/common/types";
import { GenericController } from "src/modules/generics/app/generics.controller";
import { ApsisUserDto } from "../dtos/apsisUser.dto";
import { ApsisUserService } from "./apsisUser.service";

@Controller("tenant/user")
export class ApsisUserController extends GenericController {
  constructor(private readonly apsisUserService: ApsisUserService) {
    super(apsisUserService, {
      notAllowedMethods: [methodOptions.create],
    });
  }

  @Put(":id")
  @HttpCode(HttpStatus.ACCEPTED)
  updateObj(body: Partial<ApsisUserDto>, id: string) {
    body.password = undefined;
    return super.updateObj(body, id);
  }
}
