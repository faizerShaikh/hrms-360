import { IsOptional, IsString } from "class-validator";
import { SurveyDescriptionStatus } from "../type";

export class UpdateSurveyDTO {
  @IsString()
  @IsOptional()
  end_date?: string;

  @IsString()
  @IsOptional()
  lm_approval_cut_off_date?: string;

  @IsString()
  @IsOptional()
  respondant_cut_off_date?: string;

  @IsString()
  @IsOptional()
  field?: string;

  @IsString()
  @IsOptional()
  status?: SurveyDescriptionStatus;
}
