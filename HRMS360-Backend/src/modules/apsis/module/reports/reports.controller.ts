import { Controller, Get, Query } from "@nestjs/common";

import { ApsisReportsService } from "./reports.service";

@Controller("admin-reports")
export class ApsisReportsController {
  constructor(private readonly apsisReportsService: ApsisReportsService) {}

  @Get("all-surveys-report")
  AllSurveysReport() {
    return this.apsisReportsService.AllSurveysReport();
  }

  @Get("tenant-wise-report-till-date")
  TenantWiseReportTillDate() {
    return this.apsisReportsService.TenantWiseReport();
  }

  @Get("channel-partner-report-till-date")
  ChannelPartnerReportTillDate() {
    return this.apsisReportsService.ChannelPartnerReport();
  }

  @Get("all-surveys-report-monthly")
  SurveysReportMonthly(
    @Query() query: { start_month: string; end_month: string }
  ) {
    return this.apsisReportsService.AllSurveysReport(
      query?.start_month,
      query?.end_month
    );
  }

  @Get("tenant-wise-report-monthly")
  TenantWiseReportMonthly(
    @Query() query: { start_month: string; end_month: string }
  ) {
    return this.apsisReportsService.TenantWiseReport(
      query?.start_month,
      query?.end_month
    );
  }

  @Get("channel-partner-report-monthly")
  ChannelPartnerReportMonthly(
    @Query() query: { start_month: string; end_month: string }
  ) {
    return this.apsisReportsService.ChannelPartnerReport(
      query?.start_month,
      query?.end_month
    );
  }
}
