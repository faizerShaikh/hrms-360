import { IsOptional, IsString } from "class-validator";

export class UpdateCompetencyDTO {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  description: string;
}
