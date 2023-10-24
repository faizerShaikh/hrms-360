import { Body, Controller, Put } from "@nestjs/common";
import { GenericController } from "src/modules/generics/app/generics.controller";
import { RaterService } from "./rater.service";

@Controller("setting/rater")
export class RaterController extends GenericController {
  constructor(private readonly raterService: RaterService) {
    super(raterService);
  }

  @Put("manage-order")
  manageOrder(@Body() body: any) {
    return this.raterService.manageOrder(body);
  }
}
