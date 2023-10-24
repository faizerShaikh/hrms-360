import { Module } from "@nestjs/common";
import { ApsisReportsService } from "./reports.service";
import { ApsisReportsController } from "./reports.controller";

@Module({
  controllers: [ApsisReportsController],
  providers: [ApsisReportsService],
})
export class ApsisReportsModule {}
