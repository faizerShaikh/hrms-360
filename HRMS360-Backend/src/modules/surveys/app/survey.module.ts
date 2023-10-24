import { SurveyService } from "./survey.service";
import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import {
  CompetencyComment,
  DraftSurvey,
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
import { JwtModule } from "@nestjs/jwt";
import { jwtFactory } from "src/modules/auth/jwt";
import { Tenant, TenantHistory, TenantUser } from "src/modules/tenants/models";
import { ReportsModule } from "src/modules/reports/reports.module";
import { ReportsService } from "src/modules/reports/reports.service";
import { NbolSurveyController } from "./nbolSurvey.controller";
import { NbolSurveyService } from "./nbolSurvey.service";
import { Designation } from "src/modules/settings/modules/designation/models";
import { Department } from "src/modules/settings/modules/department/models";
import { SurveyProcessor } from "./nbolsurvey.processor";
import { SUREVY_QUEUE } from "../constants";
import { BullModule } from "@nestjs/bull";
import { CommentResponse } from "../models/commentResponse.model";

@Module({
  imports: [
    BullModule.registerQueue({
      name: SUREVY_QUEUE,
    }),
    JwtModule.registerAsync({ ...jwtFactory }),
    SequelizeModule.forFeature([
      Tenant,
      TenantUser,
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
      ReportsModule,
      Designation,
      CompetencyComment,
      Department,
      DraftSurvey,
      TenantUser,
      CommentResponse,
    ]),
  ],
  controllers: [SurveyController, GetSurveyController, NbolSurveyController],
  providers: [
    SurveyService,
    GetSurveyService,
    ReportsService,
    NbolSurveyService,
    SurveyProcessor,
  ],
  exports: [
    SurveyService,
    SurveyService,
    GetSurveyService,
    ReportsService,
    NbolSurveyService,
    SurveyProcessor,
  ],
})
export class SurveyModule {}
