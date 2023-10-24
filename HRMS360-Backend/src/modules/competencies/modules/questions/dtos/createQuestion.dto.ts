import { Type } from "class-transformer";
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";
import { QuestionResponseOptions } from "../types";
import { QuestionResponseDTO } from "./questionResponse.dto";

export class CreateQuestionDTO {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  regional_text: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(QuestionResponseOptions)
  response_type: string;

  @IsString()
  @IsNotEmpty()
  competency_id: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  area_assessments: string[];

  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayNotEmpty()
  @Type(() => QuestionResponseDTO)
  responses: QuestionResponseDTO[];
}
