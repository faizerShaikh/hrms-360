import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Competency } from "src/modules/competencies/models";
import {
  QuestionnaireCompetency,
  QuestionnaireQuestion,
} from "src/modules/questionnaires/models";
import { Tenant, TenantHistory } from "src/modules/tenants/models";
import { Question } from "../../questions/models";
import { StandardCompetency } from "../models";
import { StandardQuestionModule } from "../modules/standardQuestions/app/standardQuestion.module";
import { StandardCompetancyController } from "./standardcompetancy.controller";
import { StandardCompetancyService } from "./standardcompetancy.service";

@Module({
  imports: [
    SequelizeModule.forFeature([
      StandardCompetency,
      Competency,
      Tenant,
      QuestionnaireCompetency,
      QuestionnaireQuestion,
      Question,
      TenantHistory,
    ]),
    StandardQuestionModule,
  ],
  controllers: [StandardCompetancyController],
  providers: [StandardCompetancyService],
})
export class StandardCompetencyModule {}
