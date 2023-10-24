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
import { CreateQuestionnaireDTO, UpdateQuestionnaireDTO } from "../dtos";
import { QuestionnaireService } from "./questionnaire.service";

@Controller("questionnaire")
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(TransactionInterceptor)
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

  @Get("competency-questions/:questionnaire_id/:competency_id")
  getSingleQuestionnaireQuestion(
    @Param("questionnaire_id") questionnaire_id: string,
    @Param("competency_id") competency_id: string
  ) {
    return this.questionnaireService.getSingleQuestionnaireQuestion(
      questionnaire_id,
      competency_id
    );
  }

  @Get("competencies/:id")
  getSingleQuestionnaireCompetencies(@Param("id") id: string) {
    return this.questionnaireService.getSingleQuestionnaireCompetencies(id);
  }

  @Get(":id")
  getSingleQuestionnaire(@Param("id") id: string) {
    return this.questionnaireService.getSingleQuestionnaire(id);
  }

  @Put("manage-order-questions/:questionnaire_id")
  manageOrderQuestions(
    @Body() body: any,
    @Param("questionnaire_id") questionnaire_id: string
  ) {
    return this.questionnaireService.manageOrderQuestions(
      body,
      questionnaire_id
    );
  }

  @Put("manage-order/:questionnaire_id")
  manageOrder(
    @Body() body: any,
    @Param("questionnaire_id") questionnaire_id: string
  ) {
    return this.questionnaireService.manageOrder(body, questionnaire_id);
  }

  @Put(":id")
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(TransactionInterceptor)
  updateQuestionnaire(
    @Body() body: UpdateQuestionnaireDTO,
    @Param("id") id: string
  ) {
    return this.questionnaireService.updateQuestionnaire(body, id);
  }
}
