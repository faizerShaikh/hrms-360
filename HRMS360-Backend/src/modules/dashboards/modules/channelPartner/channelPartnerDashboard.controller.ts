import { Controller, Get, Query } from "@nestjs/common";
import { Param } from "@nestjs/common/decorators";

import { ChannelPartnerDashboardService } from "./channelPartnerDashboard.service";

@Controller("dashboard/channel-partner")
export class ChannelPartnerDashboardController {
  constructor(
    private readonly dashboardService: ChannelPartnerDashboardService
  ) {}

  @Get("count")
  getDashboardCP() {
    return this.dashboardService.dashboardCP();
  }

  // @Get('chart/:range')
  // getDashBoardChartCP(@Param('range') range : any){
  //   return this.dashboardService.chartsCP(range)
  // }

  @Get("total-tenant-chart")
  getTotalTenantChart(@Query("range") range: any) {
    return this.dashboardService.totalTenants(range);
  }

  @Get("active-tenant-chart")
  getActiveTenantChart(@Query("range") range: any) {
    return this.dashboardService.activeTenants(range);
  }

  @Get("survey-count-chart")
  getServeyChart(@Query("range") range: any) {
    return this.dashboardService.surveyCount(range);
  }

  @Get("industry-chart")
  getIndustry(@Query("range") range: any) {
    return this.dashboardService.industryChart(range);
  }

  @Get("competency-chart")
  getCompetency() {
    return this.dashboardService.getCompetency();
  }

  @Get("question-chart")
  getQuestion() {
    return this.dashboardService.getQuestions();
  }

  @Get("tenants")
  getAllTenants() {
    return this.dashboardService.allTenants();
  }

  @Get("survey/:schema_name")
  getAllSurveysForTenant(@Param("schema_name") schema_name: string) {
    return this.dashboardService.getAllSurveysForTenant(schema_name);
  }
}
