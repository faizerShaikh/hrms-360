import { SurveyInterface } from "interfaces/survey";
import { AssessmentAreaInterface, RaterInterface } from "..";
import { BaseObjInterface } from "../base";

export interface ResponseObjInterface extends BaseObjInterface {
  type: string;
  label: string;
  score: number | null;
  question_id?: string;
  value?: number | null;
}

export interface SurveyResponse extends BaseObjInterface {
  survey_description_id: string;
  survey_respondant_id: string;
  question_id: string;
  response_id?: string;
  response_text?: string;
  survey_external_respond?: string;
  consider_in_report: boolean;
  rater?: RaterInterface;
  survey_id: string;
}

export interface QuestionInterface<T = string> extends BaseObjInterface {
  text: string;
  competency_id: string;
  response_type: T;
  area_assessments: Array<AssessmentAreaInterface>;
  responses?: Array<ResponseObjInterface>;
  competency?: CompetencyInterface;
  surveyResponses?: Array<SurveyResponse>;
  standard_response?: boolean;
  raters?: RaterInterface[];
  surveys?: SurveyInterface[];
}

export interface CompetencyInterface extends BaseObjInterface {
  title: string;
  description: string;
  comments?: CompetencyComments[];
  type: "standard" | "custom";
  no_of_questions?: number;
  questions?: Array<QuestionInterface>;
}

export interface CompetencyComments extends BaseObjInterface {
  comments: string;
  survey_respondent_id: string;
  survey_external_respondent_id: string;
  survey: SurveyInterface;
}
export enum QuestionResponseType {
  text = "text",
  yes_no = "yes_no",
  single_choice = "single_choice",
  multiple_choice = "multiple_choice",
  likert_scale = "likert_scale",
}
