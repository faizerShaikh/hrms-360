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
  UseInterceptors,
} from "@nestjs/common";
import { TransactionInterceptor } from "src/common/interceptors";

import { UpdateCompetencyDTO } from "../../../dtos";
import { createCompetencyDTO } from "../../../dtos/createCompetency.dto";
import { StandardCompetancyService } from "./standardcompetancy.service";

@Controller("standard-competency")
export class StandardCompetancyController {
  constructor(
    private readonly standardCompetancyService: StandardCompetancyService
  ) {}

  @UseInterceptors(TransactionInterceptor)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createCompetency(@Body() body: createCompetencyDTO) {
    return this.standardCompetancyService.createCompetency(body);
  }

  @Get()
  getAllCompetency() {
    return this.standardCompetancyService.getAllCompetency();
  }

  @Get("by-type/:type")
  getAllCompetencyByType(@Param("type") type: string) {
    return this.standardCompetancyService.getAllCompetencyByType(type);
  }

  @Get(":id")
  getOneCompetency(@Param("id") id: string) {
    return this.standardCompetancyService.findOneCompetency(id);
  }

  // @Put("manage-order")
  // manageOrder(@Body() body: any) {
  //   return this.standardCompetancyService.manageOrder(body);
  // }

  @UseInterceptors(TransactionInterceptor)
  @Put(":id")
  @HttpCode(HttpStatus.ACCEPTED)
  updateCompetency(@Param("id") id: string, @Body() body: UpdateCompetencyDTO) {
    return this.standardCompetancyService.updateCompetency(body, id);
  }

  @UseInterceptors(TransactionInterceptor)
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCompetency(@Param("id") id: string) {
    return this.standardCompetancyService.deleteCompetency(id);
  }
}
