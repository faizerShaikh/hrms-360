import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { CreateRaterDTO } from "src/modules/settings/modules/rater/dtos";

class SurveyRespondantDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  contact: string;

  @IsString()
  @IsNotEmpty()
  resp_status: string;

  @IsString()
  @IsOptional()
  designation: string;

  @IsString()
  @IsOptional()
  employee_code: string;

  @IsString()
  @IsOptional()
  department: string;
}
class SurveyExternalRespondantDTO {
  @IsString()
  @IsNotEmpty()
  respondant_name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  respondant_email: string;

  @IsString()
  @IsNotEmpty()
  resp_status: string;
}

class RatersDTO {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  @IsBoolean()
  is_external: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyRespondantDTO)
  surveyRespondant: SurveyRespondantDTO[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyRespondantDTO)
  surveyExternalRespondant: SurveyExternalRespondantDTO[];
}

export class SurveyRespondentupdateDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  designation: string;

  @IsString()
  @IsOptional()
  employee_code: string;

  @IsString()
  @IsOptional()
  contact: string;

  @IsString()
  @IsOptional()
  department: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  ratee_status: string;

  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => RatersDTO)
  @IsOptional()
  raters: RatersDTO[];
}

class RespondantDTO {
  @IsObject()
  @ValidateNested({ each: true })
  rater: CreateRaterDTO & { order: number; id: string };
}

export class SurveyRespondentAddDTO {
  @IsObject()
  @IsNotEmpty()
  respondant: RespondantDTO;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  contact: string;

  @IsString()
  @IsOptional()
  designation: string;

  @IsString()
  @IsOptional()
  employee_code: string;

  @IsString()
  @IsOptional()
  department: string;
}
