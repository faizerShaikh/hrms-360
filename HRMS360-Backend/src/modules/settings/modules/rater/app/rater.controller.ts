import { Controller } from "@nestjs/common";

import { GenericController } from "src/modules/generics/app/generics.controller";
import { RaterService } from "./rater.service";

@Controller("setting/rater")
export class RaterController extends GenericController {
  constructor(private readonly raterService: RaterService) {
    super(raterService);
  }
}
