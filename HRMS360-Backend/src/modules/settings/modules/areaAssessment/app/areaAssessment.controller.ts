import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";

import { GenericController } from "src/modules/generics/app/generics.controller";
import { CreateAreaAssessmentDTO, UpdateAreaAssessmentDTO } from "../dtos";
import { AreaAssessmentService } from "./areaAssessment.service";

@Controller("setting/area-assessment")
export class AreaAssessmentController extends GenericController {
  constructor(private readonly areaAssessmentService: AreaAssessmentService) {
    super(areaAssessmentService, {
      createDTO: CreateAreaAssessmentDTO,
      updateDTO: UpdateAreaAssessmentDTO,
    });
  }

  @Post("standard")
  createStandardAreaAssessment(@Body() body: CreateAreaAssessmentDTO) {
    return this.areaAssessmentService.createStandardAreaAssessment(body);
  }

  @Get("standard")
  findAllStandardAreaAssessment() {
    return this.areaAssessmentService.findAllStandardAreaAssessment();
  }

  @Delete("standard/:id")
  deleteStandardAreaAssessment(@Param("id") id: string) {
    return this.areaAssessmentService.deleteStandardAreaAssessment(id);
  }

  @Put("standard/:id")
  updateStandardAreaAssessment(
    @Body() body: UpdateAreaAssessmentDTO,
    @Param("id") id: string
  ) {
    return this.areaAssessmentService.updateStandardAreaAssessment(body, id);
  }
}
