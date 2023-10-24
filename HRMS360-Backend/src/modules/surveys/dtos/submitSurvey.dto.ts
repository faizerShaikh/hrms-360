import { Type } from "class-transformer";
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class SurveyResponseDTO {
  @IsString()
  @IsOptional()
  id: string;

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

  @IsString()
  @IsOptional()
  expected_response_id: string;

  @IsNumber()
  @IsOptional()
  gap: number;
}

export class SurveyRespondentDTO {
  @IsString()
  @IsObject()
  respondent_id: string;

  @IsString()
  @IsOptional()
  token?: string;

  // @IsBoolean()
  // @IsOptional()
  // is_competency_comment?: string;
  @IsBoolean()
  @IsOptional()
  is_comment_response?: string;

  @IsString()
  @IsObject()
  survey_external_respondant_id: string;

  @IsString()
  @IsNotEmpty()
  survey_id: string;

  @IsString()
  @IsOptional()
  question_id: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => SurveyResponseDTO)
  responses: SurveyResponseDTO[];

  // @IsArray()
  // @IsOptional()
  // @ValidateNested({ each: true })
  // @ArrayMinSize(1)
  // @Type(() => CompetencyCommentsDTP)
  // competencyComments: CompetencyCommentsDTP[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CommentResponseDTO)
  commentResponses: CommentResponseDTO[];
}

export class CommentResponseDTO {
  @IsString()
  @IsNotEmpty()
  survey_id: string;

  @IsString()
  @IsNotEmpty()
  response_text: string;

  @IsString()
  @IsNotEmpty()
  question_type: string;

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

  @IsBoolean()
  @IsOptional()
  fillForm: boolean;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => SurveyRespondentDTO)
  surveyResponses: SurveyRespondentDTO[];

  // @IsArray()
  // @ArrayNotEmpty()
  // @ValidateNested({ each: true })
  // @ArrayMinSize(1)
  // @Type(() => CompetencyCommentsDTP)
  // competencyComments: CompetencyCommentsDTP[];

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CommentResponseDTO)
  commentResponses: CommentResponseDTO[];
}
export class SubmitSurveySingleRateeDTO {
  @IsString()
  @IsNotEmpty()
  respondant_id: string;

  @IsBoolean()
  @IsNotEmpty()
  is_external: boolean;
}
export class SubmitSingleSurveyDTO {
  @IsString()
  @IsOptional()
  status: string;

  @IsString()
  @IsOptional()
  respondant_id: string;

  @IsBoolean()
  @IsOptional()
  is_external: boolean;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => SurveySingleResponseDTO)
  surveyResponses: SurveySingleResponseDTO[];

  // @IsObject()
  // competencyComments: { [key: string]: string };

  @IsArray()
  @ArrayNotEmpty()
  // @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CommentResponseDTO)
  commentResponses: CommentResponseDTO[];
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

  @IsString()
  @IsOptional()
  survey_id: string;

  @IsString()
  @IsOptional()
  expected_response_id: string;

  @IsNumber()
  @IsOptional()
  gap: number;
}
