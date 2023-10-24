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
  description: string;

  @IsString()
  @IsNotEmpty()
  end_date: string;

  @IsString()
  @IsOptional()
  reminder_frequency: string;

  @IsString()
  @IsNotEmpty()
  client_contact: string;

  @IsString()
  @IsNotEmpty()
  questionnaire_id: string;

  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsArray()
  @IsString({ each: true })
  employees: string[];
}
