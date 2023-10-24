import { StandardQuestionService } from "./standardQuestion.service";
import { Module } from "@nestjs/common";
import { StandardQuestionController } from "./standardQuestion.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { Tenant, TenantHistory } from "src/modules/tenants/models";
import { Competency } from "src/modules/competencies/models";
import {
  Question,
  QuestionAreaAssessment,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { QuestionnaireQuestion } from "src/modules/questionnaires/models";
import {
  StandardQuestion,
  StandardQuestionAreaAssessment,
  StandardQuestionResponse,
} from "../models";
import { StandardCompetency } from "../../../models";
import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";

@Module({
  imports: [
    SequelizeModule.forFeature([
      Question,
      QuestionAreaAssessment,
      StandardQuestion,
      StandardQuestionAreaAssessment,
      Tenant,
      StandardQuestionResponse,
      QuestionResponse,
      StandardCompetency,
      Competency,
      QuestionnaireQuestion,
      TenantHistory,
      AreaAssessment,
    ]),
  ],
  controllers: [StandardQuestionController],
  providers: [StandardQuestionService],
})
export class StandardQuestionModule {}
