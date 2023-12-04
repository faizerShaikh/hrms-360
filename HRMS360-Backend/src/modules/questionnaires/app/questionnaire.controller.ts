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

import { CreateQuestionnaireDTO, UpdateQuestionnaireDTO } from "../dtos";
import { QuestionnaireService } from "./questionnaire.service";

@Controller("questionnaire")
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createQuestionnaire(
    @Body()
    body: CreateQuestionnaireDTO
  ) {
    return this.questionnaireService.createQuestionnaire(body);
  }

  @Get()
  getAllQuestionnaire() {
    return this.questionnaireService.getAllQuestionnaire();
  }

  @Get("questions/:id/:competency_id")
  getAllQuestions(
    @Param("id") id: string,
    @Param("competency_id") competency_id: string
  ) {
    return this.questionnaireService.getAllQuestions(id, competency_id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteQuestionnaire(@Param("id") id: string) {
    return this.questionnaireService.deleteQuestionnaire(id);
  }

  @Get(":id")
  getSingleQuestionnaire(@Param("id") id: string) {
    return this.questionnaireService.getSingleQuestionnaire(id);
  }

  @Put(":id")
  @HttpCode(HttpStatus.ACCEPTED)
  updateQuestionnaire(
    @Body() body: UpdateQuestionnaireDTO,
    @Param("id") id: string
  ) {
    return this.questionnaireService.updateQuestionnaire(body, id);
  }
}
