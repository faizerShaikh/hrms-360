import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";

export class QuestionResponseDTO {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  label: string;

  @IsNumber()
  @ValidateIf((_, value) => value !== null)
  score: number | null;

  @IsOptional()
  question_id: string;
}
