import { TenantsService } from "./tenants.service";
import { TenantsController } from "./tenants.controller";

import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Tenant, TenantMetaData, TenantUser } from "../models";

import { ApsisUser } from "../../apsis/module/apsisUser/model";
import { Department } from "src/modules/settings/modules/department/models";
import { Designation } from "src/modules/settings/modules/designation/models";
import { ChannelPartnerUserModule } from "../modules/channelPartner/modules/users/channelPartnerUser.module";
import { Rater } from "src/modules/settings/modules/rater/models";
import { ApsisUserModule } from "../../apsis/module/apsisUser/app/apsisUser.module";

@Module({
  imports: [
    SequelizeModule.forFeature([
      Tenant,
      TenantUser,
      ApsisUser,
      Department,
      Designation,
      Rater,
      TenantMetaData,
    ]),
    ApsisUserModule,
    ChannelPartnerUserModule,
  ],
  controllers: [TenantsController],
  exports: [TenantsService],
  providers: [TenantsService],
})
export class TenantsModule {}
