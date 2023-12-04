import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Competency } from "src/modules/competencies/models";
import {
  Question,
  QuestionAreaAssessment,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { StandardCompetency } from "src/modules/competencies/modules/standardCompetency/models";
import {
  QuestionnaireCompetency,
  QuestionnaireQuestion,
} from "src/modules/questionnaires/models";
import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";
import { Department } from "src/modules/settings/modules/department/models";
import { Designation } from "src/modules/settings/modules/designation/models";
import { Rater } from "src/modules/settings/modules/rater/models";
import { TenantsService } from "src/modules/tenants/app/tenants.service";
import { Tenant, TenantMetaData, TenantUser } from "src/modules/tenants/models";
import { ChannelPartnerController } from "./channelPartner.controller";
import { ChannelPartnerService } from "./channelPartner.service";

@Module({
  imports: [
    SequelizeModule.forFeature([
      AreaAssessment,
      Competency,
      QuestionnaireCompetency,
      QuestionnaireQuestion,
      QuestionResponse,
      QuestionAreaAssessment,
      Question,
      Tenant,
      Department,
      Designation,
      TenantUser,
      Rater,
      StandardCompetency,
      TenantMetaData,
    ]),
  ],
  controllers: [ChannelPartnerController],
  providers: [ChannelPartnerService, TenantsService],
})
export class ChannelPartnerModule {}
