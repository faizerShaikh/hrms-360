import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { SequelizeModule } from "@nestjs/sequelize";
import { jwtFactory } from "../auth/jwt";
import { Competency } from "../competencies/models";
import { Question } from "../competencies/modules/questions/models";
import { Questionnaire } from "../questionnaires/models";
import { Rater } from "../settings/modules/rater/models";
import { Survey, SurveyDescription } from "../surveys/models";
import { Tenant } from "../tenants/models";
import { User } from "../users/models";
import { CompositReportService } from "./dual-gap/composit-report.service";
import { DualGapController } from "./dual-gap/dual-gap.controller";
import { DualGapService } from "./dual-gap/dual-gap.service";
import { NewReportService } from "./newReport.service";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [
    JwtModule.registerAsync({ ...jwtFactory }),
    SequelizeModule.forFeature([
      Tenant,
      User,
      Competency,
      Rater,
      Survey,
      SurveyDescription,
      Questionnaire,
      Question,
    ]),
  ],
  controllers: [ReportsController, DualGapController],
  exports: [
    ReportsService,
    NewReportService,
    DualGapService,
    CompositReportService,
  ],
  providers: [
    ReportsService,
    NewReportService,
    DualGapService,
    CompositReportService,
  ],
})
export class ReportsModule {}
