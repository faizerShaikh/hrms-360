import { Body, Controller, Get, Param, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { createReadStream, statSync } from "fs";
import { NewReportService } from "./newReport.service";
import { ReportsService } from "./reports.service";

@Controller("reports")
export class ReportsController {
  constructor(
    private readonly reportsServivce: ReportsService,
    private readonly newReportService: NewReportService
  ) {}

  @Post("get-token")
  async getPDFToken(@Body() body: any) {
    return this.reportsServivce.getPDFToken(body);
  }

  @Get("avg-per-role-group/:id/:survey_id")
  async avgPerRoalGroup(
    @Param("id") id: string,
    @Param("survey_id") survey_id: string
  ) {
    return this.reportsServivce.avgPerRoalGroup(id, survey_id);
  }

  @Get("competency-rating-report-desc/:id/:survey_id")
  async compRatingDescending(
    @Param("id") id: string,
    @Param("survey_id") survey_id: string
  ) {
    return this.reportsServivce.compRatingDescending(id, survey_id);
  }

  @Get("likert-scale-report/:id/:survey_id")
  async likertScaleReport(
    @Param("id") id: string,
    @Param("survey_id") survey_id: string
  ) {
    return this.reportsServivce.likertScaleReport(id, survey_id);
  }

  @Get("yes-no-report/:id/:survey_id")
  async yesNoReport(
    @Param("id") id: string,
    @Param("survey_id") survey_id: string
  ) {
    return this.reportsServivce.yesNoReport(id, survey_id);
  }

  @Get("multiple-mcq-report/:id/:survey_id")
  async mcqReport(
    @Param("id") id: string,
    @Param("survey_id") survey_id: string
  ) {
    return this.reportsServivce.mcqReport(id, survey_id);
  }

  @Get("comments-report/:id/:survey_id")
  async commentsReport(
    @Param("id") id: string,
    @Param("survey_id") survey_id: string
  ) {
    return this.reportsServivce.commentsReport(id, survey_id);
  }

  @Get("get-competency-wise-report/:id/:survey_id")
  async getCompitencyLevelReport(
    @Param("id") id: string,
    @Param("survey_id") survey_id: string
  ) {
    return this.reportsServivce.getCompitencyLevelReport(id, survey_id);
  }

  @Get("get-question-wise-report/:id/:survey_id")
  async getQuestionWiseReport(
    @Param("id") id: string,
    @Param("survey_id") survey_id: string
  ) {
    return this.reportsServivce.getQuestionWiseReport(id, survey_id);
  }

  @Get("single-response-report-data/:id")
  async getSingleResponseReportData(
    @Res() res: Response,
    @Param("id") id: string
  ) {
    const data = await this.newReportService.getSingleResponseReportData(id);
    return res.render("single-gap/report", data);
  }

  @Get("single-response-report/:token")
  async singleResponseReport(
    @Param("token") token: string,
    @Res() res: Response
  ) {
    const path = await this.newReportService.getSingleResponseReport(token);
    var file = createReadStream(path);
    var stat = statSync(path);
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${path.split(`reports/`)[1]}`
    );
    file.pipe(res);
    return;
  }

  @Get("pdf/:token")
  async savePdf(@Param("token") token: string, @Res() res: Response) {
    const path = await this.reportsServivce.genratePDF(token);
    var file = createReadStream(path);
    var stat = statSync(path);
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${path.split(`reports/`)[1]}`
    );
    file.pipe(res);
    return;
  }

  @Get("download-report/:id")
  async getReport(@Param("id") id: string) {
    return this.reportsServivce.getReport(id);
  }

  @Get("get-report-data/:id")
  async getReportData(@Param("id") id: string) {
    return this.reportsServivce.getReportData(id);
  }

  @Get("intro-detail/:id")
  async introDetail(@Param("id") id: string) {
    return this.reportsServivce.introDetail(id);
  }
}
