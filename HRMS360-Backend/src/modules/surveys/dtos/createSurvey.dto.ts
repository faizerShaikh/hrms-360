import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateSurveyDTO {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  end_date: string;

  @IsString()
  @IsNotEmpty()
  respondant_cut_off_date: string;

  @IsString()
  @IsNotEmpty()
  lm_approval_cut_off_date: string;

  @IsString()
  @IsNotEmpty()
  questionnaire_id: string;

  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsArray()
  @IsString({ each: true })
  employees: string[];
}

export class SurveyFilterDTO {
  @IsArray()
  // @IsNotEmpty()
  departments: string[];

  @IsArray()
  // @IsNotEmpty()
  designations: string[];

  @IsString()
  @IsOptional()
  text: string;
}
