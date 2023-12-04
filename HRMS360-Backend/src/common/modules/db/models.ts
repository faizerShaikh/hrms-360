import { ApsisUser } from "src/modules/apsis/module/apsisUser/model";
import { Competency } from "src/modules/competencies/models";
import {
  Question,
  QuestionAreaAssessment,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { StandardCompetency } from "src/modules/competencies/modules/standardCompetency/models";
import {
  StandardQuestion,
  StandardQuestionAreaAssessment,
  StandardQuestionResponse,
} from "src/modules/competencies/modules/standardCompetency/modules/standardQuestions/models";
import {
  Questionnaire,
  QuestionnaireCompetency,
  QuestionnaireQuestion,
} from "src/modules/questionnaires/models";
import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";
import { Department } from "src/modules/settings/modules/department/models";
import { Designation } from "src/modules/settings/modules/designation/models";
import { Industry } from "src/modules/settings/modules/industry/models";
import { Rater } from "src/modules/settings/modules/rater/models";
import {
  Survey,
  SurveyDescription,
  SurveyExternalRespondant,
  SurveyRespondant,
  SurveyResponse,
  SurveySuggestionsLogs,
  CompetencyComment,
} from "src/modules/surveys/models";
import { Tenant, TenantHistory, TenantUser } from "src/modules/tenants/models";
import { TenantMetaData } from "src/modules/tenants/models/tenantMetaData.model";
import { User } from "src/modules/users/models";

export const publicTables = [
  Industry,
  Tenant,
  TenantUser,
  ApsisUser,
  TenantHistory,
  TenantMetaData,
  StandardCompetency,
  StandardQuestion,
  StandardQuestionAreaAssessment,
  StandardQuestionResponse,
];
export const schemaTables = [
  Department,
  Designation,
  AreaAssessment,
  User,
  Competency,
  Question,
  QuestionAreaAssessment,
  QuestionResponse,
  Questionnaire,
  QuestionnaireCompetency,
  QuestionnaireQuestion,
  SurveyDescription,
  Rater,
  Survey,
  SurveyExternalRespondant,
  SurveyRespondant,
  SurveySuggestionsLogs,
  SurveyResponse,
  CompetencyComment,
];
