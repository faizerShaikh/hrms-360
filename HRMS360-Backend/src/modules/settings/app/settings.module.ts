import { Module } from "@nestjs/common";
import { AreaAssessmentModule } from "../modules/areaAssessment/app/areaAssessment.module";
import { DepartmentModule } from "../modules/department/app/department.module";
import { DesignationModule } from "../modules/designation/app/designation.module";
import { IndustryModule } from "../modules/industry/app/industry.module";
import { RaterModule } from "../modules/rater/app/rater.module";
import { StandardResponseModule } from "../modules/standardResponses/app/standardResponse.module";

@Module({
  imports: [
    AreaAssessmentModule,
    RaterModule,
    DepartmentModule,
    DesignationModule,
    IndustryModule,
    StandardResponseModule,
  ],
  controllers: [],
  providers: [],
})
export class SettingsModule {}
