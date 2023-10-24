import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { TenantUser } from "src/modules/tenants/models";
import { ChannelPartnerUserController } from "./channelPartnerUser.controller";
import { ChannelPartnerUserService } from "./channelPartnerUser.service";

@Module({
  imports: [SequelizeModule.forFeature([TenantUser])],
  controllers: [ChannelPartnerUserController],
  providers: [ChannelPartnerUserService],
})
export class ChannelPartnerUserModule {}
