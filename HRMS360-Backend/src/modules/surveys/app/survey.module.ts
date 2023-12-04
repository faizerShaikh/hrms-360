import { SurveyService } from "./survey.service";
import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import {
  CompetencyComment,
  Survey,
  SurveyDescription,
  SurveyExternalRespondant,
  SurveyRespondant,
  SurveyResponse,
  SurveySuggestionsLogs,
} from "../models";
import { SurveyController } from "./survey.controller";
import { User } from "src/modules/users/models";
import {
  Questionnaire,
  QuestionnaireCompetency,
  QuestionnaireQuestion,
} from "src/modules/questionnaires/models";
import {
  Question,
  QuestionAreaAssessment,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { Competency } from "src/modules/competencies/models";
import { Rater } from "src/modules/settings/modules/rater/models";
import { GetSurveyController } from "./getSurvey.controller";
import { GetSurveyService } from "./getSurvey.service";
import {
  Tenant,
  TenantHistory,
  TenantMetaData,
} from "src/modules/tenants/models";
import { ReportsService } from "src/modules/reports/reports.service";

@Module({
  imports: [
    SequelizeModule.forFeature([
      Survey,
      SurveyDescription,
      SurveyExternalRespondant,
      SurveyRespondant,
      SurveyResponse,
      User,
      Questionnaire,
      QuestionnaireCompetency,
      QuestionnaireQuestion,
      Question,
      QuestionResponse,
      QuestionAreaAssessment,
      Competency,
      Rater,
      SurveySuggestionsLogs,
      TenantHistory,
      CompetencyComment,
      TenantMetaData,
      Tenant,
    ]),
  ],
  controllers: [SurveyController, GetSurveyController],
  providers: [SurveyService, GetSurveyService, ReportsService],
  exports: [SurveyService],
})
export class SurveyModule {}
