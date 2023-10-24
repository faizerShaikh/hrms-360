import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class ExcelSurveyDTO {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  client_contact: string;

  @IsString()
  description: string;

  @IsNotEmpty()
  end_date: string;
}

class ExcelRespondent {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  employee_code: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  designation: string;
}

class ExcelCategoryDTO {
  @IsNotEmpty()
  @IsString()
  category_id: string;

  @IsOptional()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  category_short_name: string;

  @IsNotEmpty()
  @IsNumber()
  category_no_of_raters: number;

  @IsNotEmpty()
  @IsBoolean()
  category_is_required: boolean;

  @IsNotEmpty()
  @IsString()
  category_name: string;

  @IsNotEmpty()
  @IsBoolean()
  is_external: boolean;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ExcelRespondent)
  respondents: ExcelRespondent[];
}

export class ExcelSurveyRespondentsDTO extends ExcelSurveyDTO {
  @IsString()
  @IsNotEmpty()
  ratee_id: string;

  @IsString()
  @IsOptional()
  employee_code: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  ratee_name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmpty()
  ratee_email: string;

  @IsString()
  ratee_contact: string | number;

  @IsOptional()
  @IsString()
  ratee_designation: string;

  @IsOptional()
  @IsString()
  ratee_department: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ExcelCategoryDTO)
  categories: ExcelCategoryDTO[];
}
