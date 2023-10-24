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

  @IsString()
  @IsNotEmpty()
  group_id: string;
}
