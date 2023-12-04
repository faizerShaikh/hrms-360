import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Competency } from "../competencies/models";
import { Question } from "../competencies/modules/questions/models";
import { Questionnaire } from "../questionnaires/models";
import { Rater } from "../settings/modules/rater/models";
import { Survey, SurveyDescription } from "../surveys/models";
import { Tenant } from "../tenants/models";
import { User } from "../users/models";
import { NewReportService } from "./newReport.service";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [
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
  controllers: [ReportsController],
  exports: [ReportsService, NewReportService],
  providers: [ReportsService, NewReportService],
})
export class ReportsModule {}
