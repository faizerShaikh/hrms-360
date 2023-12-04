import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Industry } from "src/modules/settings/modules/industry/models";
import {
  Survey,
  SurveyDescription,
  SurveyExternalRespondant,
} from "src/modules/surveys/models";

import { Tenant, TenantHistory } from "src/modules/tenants/models";
import { User } from "src/modules/users/models";
import { ChannelPartnerDashboardController } from "./channelPartnerDashboard.controller";
import { ChannelPartnerDashboardService } from "./channelPartnerDashboard.service";

@Module({
  imports: [
    SequelizeModule.forFeature([
      TenantHistory,
      Tenant,
      Industry,
      SurveyDescription,
      Survey,
      SurveyExternalRespondant,
      User,
    ]),
  ],
  controllers: [ChannelPartnerDashboardController],
  providers: [ChannelPartnerDashboardService],
})
export class ChannelPartnerDashboardModule {}
