import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Industry } from "src/modules/settings/modules/industry/models";

import { Tenant, TenantHistory } from "src/modules/tenants/models";
import { ChannelPartnerDashboardController } from "./channelPartnerDashboard.controller";
import { ChannelPartnerDashboardService } from "./channelPartnerDashboard.service";

@Module({
  imports: [SequelizeModule.forFeature([TenantHistory, Tenant, Industry])],
  controllers: [ChannelPartnerDashboardController],
  providers: [ChannelPartnerDashboardService],
})
export class ChannelPartnerDashboardModule {}
