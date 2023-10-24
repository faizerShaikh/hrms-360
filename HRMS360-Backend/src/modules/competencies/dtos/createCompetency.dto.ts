import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CompetencyTypeOptions } from "../types";

export class createCompetencyDTO {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  type?: CompetencyTypeOptions;
}
