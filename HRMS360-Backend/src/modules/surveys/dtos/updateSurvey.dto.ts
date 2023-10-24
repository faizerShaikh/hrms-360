import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { SurveyDescriptionStatus } from "../type";

export class UpdateSurveyDTO {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  end_date?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  status?: SurveyDescriptionStatus;
}
export class NBOUpdateSurveyDTO {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  employee_code: string;

  @IsString()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsString()
  @IsOptional()
  respodant_id: string;

  @IsBoolean()
  @IsOptional()
  is_external: boolean;
}
