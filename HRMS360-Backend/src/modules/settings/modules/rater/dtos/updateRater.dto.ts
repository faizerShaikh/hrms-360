import { PartialType } from "@nestjs/mapped-types";
import { CreateRaterDTO } from "./createRater.dto";

export class updateAreaAssessmentDTO extends PartialType(CreateRaterDTO) {}
