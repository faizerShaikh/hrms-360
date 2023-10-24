import { Controller, Get, Param, Res } from "@nestjs/common";
import { Response } from "express";
import { CompositReportService } from "./composit-report.service";
import { DualGapService } from "./dual-gap.service";

@Controller("reports/dual-gap")
export class DualGapController {
  constructor(
    private readonly dualGapService: DualGapService,
    private readonly compositReportService: CompositReportService
  ) {}

  @Get("/content/:id")
  async getReportContentNew(@Param("id") id: string, @Res() res: Response) {
    const data = await this.dualGapService.getReportContentNew(id);
    return res.render("dual-gap/individual", data);
  }

  @Get("/report/:token")
  async getReport(@Param("token") token: string, @Res() res: Response) {
    const path = await this.dualGapService.getReport(token);
    return res.redirect(path.split(`src/public`)[1]);
  }

  @Get("/composit-report/:token")
  async getCompositReport(@Param("token") token: string, @Res() res: Response) {
    const path = await this.compositReportService.getCompositReport(token);
    return res.redirect(path.split(`src/public`)[1]);
  }
  @Get("composit-content/:id")
  async getCompositReportContent(
    @Param("id") id: string,
    @Res() res: Response
  ) {
    const data = await this.compositReportService.getReportContent(id);
    return res.render("dual-gap/composit", data);
  }

  @Get("/download-composit-report/:id")
  async downloadCompositReport(@Param("id") id: string) {
    const path = await this.compositReportService.downloadReport(id);
    return path.split(`src/public`)[1];
  }

  @Get("/download-report/:id")
  async downloadReport(@Param("id") id: string) {
    const path = await this.dualGapService.downloadReport(id);
    return path.split(`src/public`)[1];
  }
}
