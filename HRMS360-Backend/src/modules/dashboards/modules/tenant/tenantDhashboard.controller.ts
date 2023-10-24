import { Controller, Get, Param, Query } from "@nestjs/common";

import { TenantDhashboardService } from "./tenantDhashboard.service";

@Controller("dashboard/tenant")
export class TenantDhashboardController {
  constructor(
    private readonly tenantDhashboardService: TenantDhashboardService
  ) {}

  @Get("assessment-chart/:id")
  getAssessmentChart(@Param("id") id: any) {
    return this.tenantDhashboardService.assessmentCompletion(id);
  }

  @Get()
  getAllDashboardData() {
    return this.tenantDhashboardService.getAllDashboardData();
  }
  @Get("total-survey")
  getAllSurveyCount() {
    return this.tenantDhashboardService.getAllSurveyCount();
  }

  @Get("total-employee")
  getAllEmployeeCount() {
    return this.tenantDhashboardService.getAllEmployeeCount();
  }

  @Get("survey-trend-chart")
  getSurveyTrend(@Query("range") range: any) {
    return this.tenantDhashboardService.surveyTrend(range);
  }
  @Get("survey-status-chart")
  getSurveyStatus(@Query("range") range: any) {
    return this.tenantDhashboardService.surveyStatus(range);
  }

  @Get("survey-table")
  getSurveyTable() {
    return this.tenantDhashboardService.surveyTable();
  }
}
