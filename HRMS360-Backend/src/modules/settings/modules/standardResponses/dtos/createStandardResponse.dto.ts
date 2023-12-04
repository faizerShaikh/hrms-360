import {
  Equals,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
} from "class-validator";

export class CreateStandardResponse {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @IsNotEmpty()
  score: string;

  @IsBoolean()
  @Equals(true)
  @IsNotEmpty()
  is_standard: boolean;

  @IsString()
  @IsNotEmpty()
  type: string;
}
