import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from "@nestjs/common";

import { UpdateCompetencyDTO } from "../dtos";
import { createCompetencyDTO } from "../dtos/createCompetency.dto";
import { getByIdsDTO } from "../dtos/getByIds.dto";
import { CompetencyService } from "./competency.service";

@Controller("competency")
export class CompetencyController {
  constructor(private readonly competencyService: CompetencyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createCompetency(@Body() body: createCompetencyDTO) {
    return this.competencyService.createCompetency(body);
  }

  @Get("")
  getAllCompetency() {
    return this.competencyService.getAllCompetency();
  }

  @Get("by-type/:type")
  getAllCompetencyByType(@Param("type") type: string) {
    return this.competencyService.getAllCompetencyByType(type);
  }

  @Post("by-ids")
  @HttpCode(HttpStatus.OK)
  getAllCompetencyByIds(@Body() body: getByIdsDTO) {
    return this.competencyService.getAllCompetencyByIds(body);
  }

  @Get(":id")
  getOneCompetency(@Param("id") id: string) {
    return this.competencyService.findOneCompetency(id);
  }

  @Put(":id")
  @HttpCode(HttpStatus.ACCEPTED)
  updateCompetency(@Param("id") id: string, @Body() body: UpdateCompetencyDTO) {
    return this.competencyService.updateCompetency(body, id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCompetency(@Param("id") id: string) {
    return this.competencyService.deleteCompetency(id);
  }
}
