import { PartialType } from "@nestjs/mapped-types";
import { CreateQuestionDTO } from "./createQuestion.dto";

export class UpdateQuestionDTO extends PartialType(CreateQuestionDTO) {}
