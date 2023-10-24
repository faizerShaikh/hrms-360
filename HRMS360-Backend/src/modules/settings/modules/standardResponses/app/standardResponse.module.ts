import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { ResponseGroup, StandardResponse } from "../models";
import { ResponseGroupController } from "./responseGroup.controller";
import { ResponseGroupService } from "./responseGroup.service";
import { StandardResponseController } from "./standardResponse.controller";
import { StandardResponseService } from "./standardResponse.service";

@Module({
  imports: [SequelizeModule.forFeature([StandardResponse, ResponseGroup])],
  controllers: [ResponseGroupController, StandardResponseController],
  providers: [ResponseGroupService, StandardResponseService],
})
export class StandardResponseModule {}
