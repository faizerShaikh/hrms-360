import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class SurveyRespondentsBaseDTO {
  @IsString()
  @IsNotEmpty()
  relationship_with_employee_id: string;

  @IsBoolean()
  @IsOptional()
  is_approved_by_employee: boolean;

  @IsBoolean()
  @IsOptional()
  is_approved_by_line_manager: boolean;
}

export class ExternalSurveyRespondentsDTO extends SurveyRespondentsBaseDTO {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  respondant_email: string;

  @IsString()
  @IsNotEmpty()
  respondant_name: string;
}
export class SurveyRespondentsDTO extends SurveyRespondentsBaseDTO {
  @IsString()
  @IsNotEmpty()
  respondant_id: string;

  @IsBoolean()
  @IsNotEmpty()
  is_selected_by_system: boolean;
}

export class AddRespondents {
  @IsString()
  @IsNotEmpty()
  survey_id: string;

  @ValidateNested({ each: true })
  @Type(() => SurveyRespondentsDTO)
  surveyRespondents: SurveyRespondentsDTO[];

  @ValidateNested({ each: true })
  @Type(() => ExternalSurveyRespondentsDTO)
  externalSurveyRespondents: ExternalSurveyRespondentsDTO[];
}
