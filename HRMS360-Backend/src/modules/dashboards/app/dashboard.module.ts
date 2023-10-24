import { Module } from "@nestjs/common";

import { ChannelPartnerDashboardModule } from "../modules/channelPartner/channelPartnerDashboard.module";
import { TenantDhashboardModule } from "../modules/tenant/tenantDhashboard.module";

@Module({
  imports: [ChannelPartnerDashboardModule, TenantDhashboardModule],
  controllers: [],
  providers: [],
})
export class DashboardModule {}
