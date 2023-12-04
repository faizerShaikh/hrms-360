import { Type } from "class-transformer";
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";

class CompetenciesDTO {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsArray()
  @IsString({ each: true })
  questionIds: string[];
}

export class CreateQuestionnaireDTO {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayNotEmpty()
  @Type(() => CompetenciesDTO)
  competencies: CompetenciesDTO[];
}
