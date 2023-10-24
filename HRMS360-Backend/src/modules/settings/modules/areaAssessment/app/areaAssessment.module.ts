import { AreaAssessmentService } from "./areaAssessment.service";
import { AreaAssessmentController } from "./areaAssessment.controller";
import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AreaAssessment } from "../models";
import { Tenant } from "src/modules/tenants/models";

@Module({
  imports: [SequelizeModule.forFeature([AreaAssessment, Tenant])],
  controllers: [AreaAssessmentController],
  providers: [AreaAssessmentService],
})
export class AreaAssessmentModule {}
