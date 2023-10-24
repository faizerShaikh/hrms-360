import { Body, Controller, Get, Post, Put } from "@nestjs/common";
import { getSearchObject } from "src/common/helpers";
import { RequestParamsService } from "src/common/modules";
import { GenericController } from "src/modules/generics/app/generics.controller";
import { CreateIndustryDTO, UpdateIndustryDTO } from "../dtos";
import { IndustryService } from "./industry.service";

@Controller("setting/industry")
export class IndustryController extends GenericController {
  constructor(
    private readonly industryService: IndustryService,
    private readonly requestParams: RequestParamsService
  ) {
    super(industryService, {
      createDTO: CreateIndustryDTO,
      updateDTO: UpdateIndustryDTO,
    });
  }

  @Get()
  getAllObj() {
    return this.industryService.findAll({
      where: !this.requestParams.is_apsis_user && {
        tenant_id: this?.requestParams?.tenant?.id,
      },
    });
  }

  @Post()
  createObj(@Body() body: CreateIndustryDTO) {
    body["tenant_id"] = !this.requestParams.is_apsis_user
      ? this.requestParams.tenant.id
      : null;
    return this.industryService.create(body);
  }

  @Put(":id")
  updateObj(@Body() body: UpdateIndustryDTO, id: string) {
    body["tenant_id"] = !this.requestParams.is_apsis_user
      ? this.requestParams.tenant.id
      : null;
    return this.industryService.update(body, id);
  }
}
