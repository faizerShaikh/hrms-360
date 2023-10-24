import {
  IsBoolean,
  IsNegative,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateRaterDTO {
  @IsString()
  @IsNotEmpty()
  category_name: string;

  @IsNumber()
  @IsNotEmpty()
  @IsNegative()
  @Min(0)
  no_of_raters: number;

  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @IsBoolean()
  @IsOptional()
  is_external?: boolean;
}
