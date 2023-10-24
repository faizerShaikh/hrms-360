import { IsNotEmpty, IsString } from "class-validator";

export class QuestionAreaAssessmentDTO {
  @IsString()
  @IsNotEmpty()
  area_assessment_id: string;

  @IsString()
  @IsNotEmpty()
  question_id: string;
}
