import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { ApsisUser } from "../model";
import { ApsisUserController } from "./apsisUser.controller";
import { ApsisUserService } from "./apsisUser.service";

@Module({
  imports: [SequelizeModule.forFeature([ApsisUser])],
  controllers: [ApsisUserController],
  exports: [],
  providers: [ApsisUserService],
})
export class ApsisUserModule {}
