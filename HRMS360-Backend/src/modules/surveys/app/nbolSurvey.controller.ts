import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  MulterIntercepter,
  TransactionInterceptor,
} from "src/common/interceptors";
import { MulterEnum } from "src/common/interfaces/multer.interfaces";
import { CreateSurveyDTO, NBOUpdateSurveyDTO } from "../dtos";
import {
  ExcelSurveyDTO,
  ExcelSurveyRespondentsDTO,
} from "../dtos/excelSurveyRespondents.dto";
import {
  SubmitSingleSurveyDTO,
  SubmitSurveySingleRateeDTO,
} from "../dtos/submitSurvey.dto";
import { NbolSurveyService } from "./nbolSurvey.service";
import { SurveyRespondentAddDTO } from "../dtos/surveyRespondentUpdate.dto";

@Controller("nbol-survey")
export class NbolSurveyController {
  constructor(private surveyService: NbolSurveyService) {}
  @Get("draft-survey/:id")
  getOneDraftSurvey(@Param("id") id: string) {
    return this.surveyService.oneDraftSurveys(id);
  }

  @Get("details/:token")
  getSurveyDetails(@Param("token") token: string) {
    return this.surveyService.getSurveyDetails(token);
  }

  @Post("/update-ratee/:id")
  updateSurveyRatee(@Body() body: any, @Param("id") id: string) {
    return this.surveyService.updateSurveyRatee(body, id);
  }

  @Post("add-ratee")
  addRatee(
    @Body("data") data: ExcelSurveyRespondentsDTO[],
    @Body() survey: any
  ) {
    return this.surveyService.addRatee(data, survey);
  }

  @Post("/rater-details")
  getFormRaterDetails(@Body() body: any) {
    return this.surveyService.getFormRaterDetails(body);
  }

  @Get("excel-file")
  getSampleExcelFile(@Query("q") createExcel = true) {
    return this.surveyService.sampleExcel(createExcel);
  }

  @Get("/excel-file/new")
  getSampleExcelFileNew(
    @Query("q") createExcel = true,
    @Query("id") id: string
  ) {
    return this.surveyService.sampleExcelNew(createExcel, id);
  }

  @Post("/single-rater-details")
  getFullDetailOfSurveyForSingleRatee(
    @Body() body: SubmitSurveySingleRateeDTO
  ) {
    return this.surveyService.getFullDetailOfSurveyForSingleRatee(body);
  }

  @Post("/single/rater-submit")
  submitSurveyForSingleRatee(@Body() body: SubmitSingleSurveyDTO) {
    return this.surveyService.submitSurveyForSingleRatee(body);
  }

  @Post("/excel-file/add-ratee/:id")
  @UseInterceptors(
    MulterIntercepter({
      type: MulterEnum.single,
      fieldName: "file",
      path: "/media/Import-excels",
      addDateTime: false,
    })
  )
  createSurveyViaExcelNewAddRatee(
    @UploadedFile()
    file: Express.Multer.File,
    @Param("id") id: string
  ) {
    return this.surveyService.CreateExcelSurveyNewAddRatee(file, id);
  }

  @Post("/excel-file/new")
  @UseInterceptors(
    MulterIntercepter({
      type: MulterEnum.single,
      fieldName: "file",
      path: "/media/Import-excels",
      addDateTime: false,
    })
  )
  createSurveyViaExcelNew(
    @UploadedFile()
    file: Express.Multer.File
  ) {
    return this.surveyService.CreateExcelSurveyNew(file);
  }

  @Post("excel-file")
  @UseInterceptors(
    MulterIntercepter({
      type: MulterEnum.single,
      fieldName: "file",
      path: "/media/Import-excels",
      addDateTime: false,
    })
  )
  createSurveyViaExcel(
    @UploadedFile()
    file: Express.Multer.File,
    @Body("format")
    keysArr: string
  ) {
    return this.surveyService.CreateExcelSurvey(file, keysArr);
  }

  @UseInterceptors(TransactionInterceptor)
  @Post("save-survey")
  saveSurvey(
    @Body("data") data: ExcelSurveyRespondentsDTO[],
    @Body() survey: ExcelSurveyDTO
  ) {
    return this.surveyService.saveSurvey(data, survey);
  }

  @Post("submit")
  launchSurvey(
    @Body("data") data: ExcelSurveyRespondentsDTO[],
    @Body() survey: CreateSurveyDTO
  ) {
    return this.surveyService.launchSurveyNew(data, survey);
  }

  @Get("draft-survey")
  getAllDraftSurvey() {
    return this.surveyService.allDraftSurveys();
  }

  @Post("submit-survey")
  @HttpCode(HttpStatus.CREATED)
  submitSurvey(@Body() body: any) {
    return this.surveyService.submitSurvey(body);
  }

  @Post("submit-survey-question")
  @HttpCode(HttpStatus.CREATED)
  submitSurveyQuestion(@Body() body: any) {
    return this.surveyService.submitSurveyQuestion(body);
  }

  @Get("email-test")
  emailTest() {
    return this.surveyService.emailTest();
  }
  @Get("test")
  outputTest() {
    return this.surveyService.getASurveyForEmail();
  }

  @Put("/:id/:survey_id")
  @HttpCode(HttpStatus.ACCEPTED)
  updateSurvey(
    @Param("id") id: string,
    @Param("survey_id") survey_id: string,
    @Body() body: NBOUpdateSurveyDTO
  ) {
    return this.surveyService.updateRater(id, survey_id, body);
  }

  @Delete("/ratee/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRatee(@Param("id") id: string) {
    return this.surveyService.deleteRatee(id);
  }

  @Delete("/rater/:id/:survey_id")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRater(
    @Param("id") id: string,
    @Param("survey_id") survey_id: string,
    @Query("is_external") is_external: string
  ) {
    return this.surveyService.deleteRater(id, survey_id, is_external === "1");
  }

  @Post("/:survey_id")
  @HttpCode(HttpStatus.ACCEPTED)
  addRespondent(
    @Param("survey_id") survey_id: string,
    @Body() body: SurveyRespondentAddDTO
  ) {
    return this.surveyService.addSurveyRespondent(body, survey_id);
  }

  @Post("/survey/complete")
  @HttpCode(HttpStatus.ACCEPTED)
  completeSurvey(@Body() body: any) {
    return this.surveyService.forceCompleteSurvey(body);
  }

  @Post("/survey/sync")
  @HttpCode(HttpStatus.ACCEPTED)
  syncSurvey(@Body() body: any) {
    return this.surveyService.syncSurvey(body);
  }

  @Get("/single-survey/progress/:id")
  @HttpCode(HttpStatus.ACCEPTED)
  downloadSingleSurveyProgress(@Param("id") id: string) {
    return this.surveyService.DownloadSingleSurveyProgress(id);
  }
}
