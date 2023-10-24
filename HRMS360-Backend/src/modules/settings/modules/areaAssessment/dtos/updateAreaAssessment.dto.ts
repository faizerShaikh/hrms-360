import { PartialType } from "@nestjs/mapped-types";
import { CreateAreaAssessmentDTO } from "./createAreaAssessment.dto";

export class UpdateAreaAssessmentDTO extends PartialType(
  CreateAreaAssessmentDTO
) {}
