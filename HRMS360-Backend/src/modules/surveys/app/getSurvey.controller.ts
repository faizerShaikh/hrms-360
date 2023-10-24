import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { GetSurveyService } from "./getSurvey.service";

@Controller("survey")
export class GetSurveyController {
  constructor(private readonly surveyService: GetSurveyService) {}

  // get all surveys
  @Get()
  getAllSurveys() {
    return this.surveyService.getAllSurveys();
  }

  // get all surveys of logged in user
  @Get("my")
  getMySurveys() {
    return this.surveyService.getMySurveys();
  }

  // get all pending surveys of logged in user (surveys which are not launched yet)
  @Get("my-pending-survey")
  getMyAllPendingSurvey() {
    return this.surveyService.getMyAllPendingSurvey();
  }

  // get all surveys which are pending for respondent approval from line manager
  @Get("pending-approval-survey")
  getAllPendingApprovalSurvey() {
    return this.surveyService.getAllPendingApprovalSurvey();
  }

  // get all surveys in which LM has suggested something to logged in user
  @Get("alternative-suggestions")
  getAllAlternativeSuggestions() {
    return this.surveyService.getAllAlternativeSuggestions();
  }

  // get all comments and suggestion of a respondent
  @Post("/detail-old")
  getFullDetailOfSurvey(@Body() body: any) {
    return this.surveyService.getFullDetailOfSurvey(body);
  }

  @Post("/detail")
  getFullDetailOfSurvey1(@Body() body: any) {
    return this.surveyService.getFullDetailOfSurvey1(body);
  }

  @Get("/respondents-by-raters/:survey_id/:id")
  getRespondentsGroupByRaters(
    @Param("survey_id") survey_id: string,
    @Param("id") id: string
  ) {
    return this.surveyService.getRespondentsGroupByRaters(survey_id, id);
  }

  @Get("/question-detail/:id")
  getQuestionDetail(@Query() body: any, @Param("id") id: string) {
    return this.surveyService.getQuestionDetail(body, id);
  }

  @Get("get-responses-excel/:survey_id")
  getResponsesExcel(@Param("survey_id") survey_id: string) {
    return this.surveyService.getResponsesExcel(survey_id);
  }

  // get all users(recipent) from a survey who's respondent approval is pending from LM
  @Get("pending-approval-survey-users/:survey_id")
  getAllPendingApprovalSurveyUsers(@Param("survey_id") survey_id: string) {
    return this.surveyService.getAllPendingApprovalSurveyUsers(survey_id);
  }

  // get all rater categories with other data such as selected respondent in each category and many more
  @Get("raters/:id")
  getAllRaterCategory(@Param("id") id: string) {
    return this.surveyService.getAllRaterCategory(id);
  }

  // get all users who are going to submit survey for this user
  @Get("/respondents/:id")
  getAllRespondentsOfSurveyRecipient(@Param("id") id: string) {
    return this.surveyService.getAllRespondentsOfSurveyRecipient(id);
  }

  // get all users who are in this survey
  @Get("/all-respondents-of-survey/:id")
  getAllRespondentsOfSurvey(
    @Param("id") id: string,
    @Query("is_external") is_external: string
  ) {
    return this.surveyService.getAllRespondentsOfSurvey(id, is_external);
  }

  // get all comments and suggestion of a respondent
  @Get("/comments/:id")
  getAllSurveyRespondentComments(@Param("id") id: string) {
    return this.surveyService.getAllSurveyRespondentComments(id);
  }

  // get all comments and suggestion of a respondent
  @Get("decode-token/:token")
  getDecodedToken(@Param("token") token: string) {
    return this.surveyService.getDecodedToken(token);
  }

  // get all comments and suggestion of a respondent
  @Get("/token/:id")
  getSurveyToken2(@Param("id") id: string) {
    return this.surveyService.getSurveyToken2(id);
  }
  @Post("/token")
  getSurveyToken(@Body() body: any) {
    return this.surveyService.getSurveyToken(body);
  }

  // get one survey
  @Get(":id")
  getOneSurvey(
    @Param("id") id: string,
    @Query("surveyDescription") surveyDescription: string
  ) {
    return this.surveyService.getOneSurvey(id, surveyDescription);
  }
}
