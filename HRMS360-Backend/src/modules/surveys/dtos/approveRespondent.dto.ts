import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ApproveRespondentDTO {
  @IsBoolean()
  @IsOptional()
  is_external: boolean = false;

  @IsString()
  @IsOptional()
  alternative: string;

  @IsString()
  @IsOptional()
  alternative_name: string;

  @IsString()
  @IsOptional()
  alternative_email: string;
}
