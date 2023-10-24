import { Inject, Injectable, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
// import { CONTEXT, RedisContext, RequestContext } from "@nestjs/microservices";
import {
  SequelizeModuleOptions,
  SequelizeOptionsFactory,
} from "@nestjs/sequelize";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { RequestInterface } from "src/common/interfaces/request.interface";
import { databaseConfig } from "src/config";
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
  ResponseGroup,
  StandardResponse,
} from "src/modules/settings/modules/standardResponses/models";
import {
  Survey,
  SurveyDescription,
  SurveyExternalRespondant,
  SurveyRespondant,
  SurveyResponse,
  SurveySuggestionsLogs,
  CompetencyComment,
  DraftSurvey,
} from "src/modules/surveys/models";
import { CommentResponse } from "src/modules/surveys/models/commentResponse.model";
import { Tenant, TenantHistory, TenantUser } from "src/modules/tenants/models";
import { TenantMetaData } from "src/modules/tenants/models/tenantMetaData.model";
import { User } from "src/modules/users/models";

let paths = [
  "/media",
  "/api/v1/tenant",
  "/api/v1/auth",
  "/api/v1/survey/submit-survey",
  "/api/v1/nbol-survey/submit-survey",
  "/api/v1/reports/pdf/",
  "/api/v1/reports/get-intro-report",
  "/api/v1/channel-partner",
  "/api/v1/standard-competency",
];

export let publicTables = [
  Industry,
  Tenant,
  TenantUser,
  ApsisUser,
  TenantHistory,
  TenantMetaData,
];
export let schemaTables = [
  Department,
  Designation,
  AreaAssessment,
  StandardCompetency,
  StandardQuestion,
  StandardQuestionAreaAssessment,
  StandardQuestionResponse,
  User,
  ResponseGroup,
  StandardResponse,
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
  DraftSurvey,
  CommentResponse,
];
@Injectable({ scope: Scope.REQUEST })
export class DBService implements SequelizeOptionsFactory {
  constructor(@Inject(REQUEST) private readonly request: RequestInterface) {}

  createSequelizeOptions(): SequelizeModuleOptions {
    let schema_name = this.request.headers["x-tenant-name"];
    let schema = DB_PUBLIC_SCHEMA;

    if (typeof schema_name === "string") {
      schema = schema_name;
    }

    // if (
    //   this.request.baseUrl.startsWith(
    //     "/api/v1/reports/dual-gap/composit-content"
    //   ) ||
    //   this.request.baseUrl.startsWith("/api/v1/reports/dual-gap/content")
    // ) {
    //   schema = "hitech_engineering";
    // }

    if (paths.some((path) => this.request.baseUrl.startsWith(path))) {
      schema = undefined;
    }

    return {
      ...databaseConfig[process.env.NODE_ENV || "development"],
      schema,
      models: [...publicTables, ...schemaTables],
    };
  }
}
