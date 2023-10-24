import { SequelizeModule } from "@nestjs/sequelize";
import { databaseConfig } from "src/config";
import { Competency } from "src/modules/competencies/models";
import {
  Questionnaire,
  QuestionnaireCompetency,
  QuestionnaireQuestion,
} from "src/modules/questionnaires/models";
import {
  Question,
  QuestionResponse,
  QuestionAreaAssessment,
} from "src/modules/competencies/modules/questions/models";
import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";
import {
  DraftSurvey,
  Survey,
  SurveyDescription,
  SurveyExternalRespondant,
  SurveyRespondant,
  SurveyResponse,
  SurveySuggestionsLogs,
} from "src/modules/surveys/models";
import { ApsisUser } from "src/modules/apsis/module/apsisUser/model";
import { Tenant, TenantUser } from "src/modules/tenants/models";
import { User } from "src/modules/users/models";
import { Department } from "src/modules/settings/modules/department/models";
import { Designation } from "src/modules/settings/modules/designation/models";
import { Rater } from "src/modules/settings/modules/rater/models";
import { Industry } from "src/modules/settings/modules/industry/models";
import { TenantMetaData } from "src/modules/tenants/models/tenantMetaData.model";
import { TenantHistory } from "src/modules/tenants/models/tenantHistory.model";
import { StandardCompetency } from "src/modules/competencies/modules/standardCompetency/models";
import {
  StandardQuestion,
  StandardQuestionAreaAssessment,
  StandardQuestionResponse,
} from "src/modules/competencies/modules/standardCompetency/modules/standardQuestions/models";

export const DBProvider = [
  SequelizeModule.forRoot({
    ...databaseConfig[process.env.NODE_ENV || "development"],
    models: [
      Industry,
      Tenant,
      TenantUser,
      ApsisUser,
      Department,
      Designation,
      AreaAssessment,
      StandardCompetency,
      StandardQuestion,
      StandardQuestionAreaAssessment,
      StandardQuestionResponse,
      Rater,
      User,
      Competency,
      Question,
      QuestionAreaAssessment,
      QuestionResponse,
      Questionnaire,
      QuestionnaireCompetency,
      QuestionnaireQuestion,
      SurveyDescription,
      Survey,
      SurveyExternalRespondant,
      SurveyRespondant,
      SurveySuggestionsLogs,
      SurveyResponse,
      TenantHistory,
      TenantMetaData,
      DraftSurvey,
    ],
    // sync:{alter:true},
    // synchronize:true,
  }),

];
