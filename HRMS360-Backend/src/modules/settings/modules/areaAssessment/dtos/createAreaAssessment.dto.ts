import { IsNotEmpty, IsString } from "class-validator";

export class CreateAreaAssessmentDTO {
  @IsString()
  @IsNotEmpty()
  name: string;
}
