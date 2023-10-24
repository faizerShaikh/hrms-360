import { QuestionService } from "./question.service";
import { Module } from "@nestjs/common";
import { QuestionController } from "./question.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { Question, QuestionAreaAssessment, QuestionResponse } from "../models";
import { Competency } from "src/modules/competencies/models";
import { QuestionnaireQuestion } from "src/modules/questionnaires/models";
import { TenantHistory } from "src/modules/tenants/models";
import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";

@Module({
  imports: [
    SequelizeModule.forFeature([
      Question,
      QuestionAreaAssessment,
      QuestionnaireQuestion,
      QuestionResponse,
      Competency,
      TenantHistory,
      AreaAssessment,
    ]),
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
})
export class QuestionModule {}
