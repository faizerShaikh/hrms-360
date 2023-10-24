import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Question } from "src/modules/competencies/modules/questions/models";
import { SurveyDescription } from "src/modules/surveys/models";
import {
  Questionnaire,
  QuestionnaireCompetency,
  QuestionnaireQuestion,
} from "../models";
import { QuestionnaireController } from "./questionnaire.controller";
import { QuestionnaireService } from "./questionnaire.service";
import { Competency } from "src/modules/competencies/models";

@Module({
  imports: [
    SequelizeModule.forFeature([
      Question,
      Questionnaire,
      QuestionnaireCompetency,
      QuestionnaireQuestion,
      SurveyDescription,
      Competency,
    ]),
  ],
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService],
})
export class QuestionnaireModule {}
