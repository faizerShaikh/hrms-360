import { CompetencyService } from "./competency.service";
import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Competency } from "../models";
import { CompetencyController } from "./competency.controller";
import { StandardCompetencyModule } from "../modules/standardCompetency/app/standardcompetancy.module";
import {
  QuestionnaireCompetency,
  QuestionnaireQuestion,
} from "src/modules/questionnaires/models";
import { Question } from "../modules/questions/models";
import { TenantHistory } from "src/modules/tenants/models";

@Module({
  imports: [
    StandardCompetencyModule,
    SequelizeModule.forFeature([
      Competency,
      QuestionnaireCompetency,
      QuestionnaireQuestion,
      Question,
      TenantHistory,
    ]),
  ],
  controllers: [CompetencyController],
  providers: [CompetencyService],
})
export class CompetencyModule {}
