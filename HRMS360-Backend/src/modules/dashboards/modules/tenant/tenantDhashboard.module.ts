import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Competency } from "src/modules/competencies/models";
import { Questionnaire } from "src/modules/questionnaires/models";
import {
  SurveyDescription,
  SurveyExternalRespondant,
  SurveyRespondant,
} from "src/modules/surveys/models";
import { User } from "src/modules/users/models";
import { TenantDhashboardController } from "./tenantDhashboard.controller";
import { TenantDhashboardService } from "./tenantDhashboard.service";

@Module({
  imports: [
    SequelizeModule.forFeature([
      SurveyDescription,
      User,
      Competency,
      Questionnaire,
      SurveyExternalRespondant,
      SurveyRespondant,
    ]),
  ],
  controllers: [TenantDhashboardController],
  providers: [TenantDhashboardService],
})
export class TenantDhashboardModule {}
