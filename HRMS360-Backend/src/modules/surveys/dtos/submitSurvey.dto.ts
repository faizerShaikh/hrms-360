import { Type } from "class-transformer";
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class SurveyResponseDTO {
  @IsString()
  @IsNotEmpty()
  category_id: string;

  @IsBoolean()
  @IsOptional()
  consider_in_report: boolean;

  @IsString()
  @IsOptional()
  survey_respondant_id: string;

  @IsString()
  @IsOptional()
  response_id: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  response_ids: string;

  @IsString()
  @IsOptional()
  response_text: string;

  @IsString()
  @IsOptional()
  survey_external_respondant_id: string;

  @IsString()
  @IsNotEmpty()
  question_id: string;

  @IsString()
  @IsNotEmpty()
  question_type: string;
}

export class SurveyRespondentDTO {
  @IsString()
  @IsOptional()
  respondent_id: string;

  @IsString()
  @IsOptional()
  survey_external_respondant_id: string;

  @IsString()
  @IsNotEmpty()
  survey_id: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => SurveyResponseDTO)
  responses: SurveyResponseDTO[];
}

export class CompetencyCommentsDTO {
  @IsString()
  @IsNotEmpty()
  survey_id: string;

  @IsString()
  @IsOptional()
  comments: string;

  @IsString()
  @IsNotEmpty()
  competency_id: string;

  @IsString()
  @IsOptional()
  survey_respondent_id: string;

  @IsString()
  @IsOptional()
  survey_external_respondent_id: string;
}

export class SubmitSurveyDTO {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => SurveyRespondentDTO)
  surveyResponses: SurveyRespondentDTO[];

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CompetencyCommentsDTO)
  competencyComments: CompetencyCommentsDTO[];
}
export class SubmitSingleSurveyDTO {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => SurveySingleResponseDTO)
  surveyResponses: SurveySingleResponseDTO[];

  @IsObject()
  // @ValidateNested({ each: true })
  // @IsNotEmpty()
  competencyComments: { [key: string]: string };
}

export class SurveySingleResponseDTO {
  @IsString()
  @IsOptional()
  survey_respondant_id: string;

  @IsString()
  @IsOptional()
  response_id: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  response_ids: string;

  @IsString()
  @IsOptional()
  response_text: string;

  @IsString()
  @IsOptional()
  survey_external_respondant_id: string;

  @IsBoolean()
  @IsOptional()
  consider_in_report: boolean;

  @IsString()
  @IsNotEmpty()
  question_id: string;

  @IsString()
  @IsNotEmpty()
  question_type: string;
}
