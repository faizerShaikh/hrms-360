import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { Public } from "src/common/decorators";
import {
  AddRespondents,
  CreateSurveyDTO,
  SurveyFilterDTO,
  UpdateSurveyDTO,
} from "../dtos";
import {
  AlternativeExternalRespondentDTO,
  AlternativeRespondentDTO,
  SendSuggestionDTO,
} from "../dtos/alternativeRespondent.dto";
import { ApproveRespondentDTO } from "../dtos/approveRespondent.dto";
import {
  SubmitSingleSurveyDTO,
  SubmitSurveyDTO,
} from "../dtos/submitSurvey.dto";
import { SurveyService } from "./survey.service";

@Controller("survey")
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  // create survey
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createSurvey(@Body() body: CreateSurveyDTO) {
    return this.surveyService.createSurvey(body);
  }

  // add respondents from a recipent
  @Post("/add-respondents")
  @HttpCode(HttpStatus.CREATED)
  addResponedents(@Body() body: AddRespondents) {
    return this.surveyService.addResponedents(body);
  }

  @Public()
  @Post("/submit-survey-single-ratee")
  @HttpCode(HttpStatus.CREATED)
  submitSurveyForSingleRatee(@Body() body: SubmitSingleSurveyDTO) {
    return this.surveyService.submitSurveyForSingleRatee(body);
  }

  // submit survey
  @Public()
  @Post("/submit-survey")
  @HttpCode(HttpStatus.CREATED)
  submitSurvey(@Body() body: SubmitSurveyDTO) {
    return this.surveyService.submitSurvey(body);
  }

  // send suggestion to user
  @Post("send-suggestion/:survey_id")
  sendSuggestion(
    @Body() body: SendSuggestionDTO,
    @Param("survey_id") survey_id: string
  ) {
    return this.surveyService.sendSuggestion(body, survey_id);
  }

  // Genrate reports for users where atleast 2 respondents have submited there surevy
  @Get("genrate-report/:survey_id")
  genrateReports(@Param("survey_id") survey_id: string) {
    return this.surveyService.genrateReports(survey_id);
  }

  // approve respondents from LM or EMP
  @Post("/approve-respondents/:id")
  @HttpCode(HttpStatus.ACCEPTED)
  approveRespondent(
    @Param("id") id: string,
    @Body() body: ApproveRespondentDTO
  ) {
    return this.surveyService.approveRespondent(id, body);
  }

  // suggest alternative respondent
  @Post("/alternative-respondents/:id")
  @HttpCode(HttpStatus.ACCEPTED)
  alternativeRespondent(
    @Body() body: AlternativeRespondentDTO,
    @Param("id") id: string
  ) {
    return this.surveyService.alternativeRespondent(body, id);
  }

  // suggest external alternative respondent
  @Post("/alternative-external-respondents/:id")
  @HttpCode(HttpStatus.ACCEPTED)
  alternativeExtrenalRespondent(
    @Body() body: AlternativeExternalRespondentDTO,
    @Param("id") id: string
  ) {
    return this.surveyService.alternativeExternalRespondent(body, id);
  }

  @Put("/date/:id")
  @HttpCode(HttpStatus.ACCEPTED)
  updateDatesOfSurvey(@Param("id") id: string, @Body() body: UpdateSurveyDTO) {
    return this.surveyService.updateDatesOfSurvey(id, body);
  }

  @Put("/:id")
  @HttpCode(HttpStatus.ACCEPTED)
  updateSurvey(@Param("id") id: string, @Body() body: UpdateSurveyDTO) {
    return this.surveyService.updateSurvey(id, body);
  }

  @Post("filter")
  @HttpCode(HttpStatus.ACCEPTED)
  applyFilter(@Body() body: SurveyFilterDTO) {
    return this.surveyService.getUsersByFilter(body);
  }
}
