import { PartialType } from "@nestjs/mapped-types";
import { CreateQuestionnaireDTO } from "./createQuestionnaire.dto";

export class UpdateQuestionnaireDTO extends PartialType(
  CreateQuestionnaireDTO
) {}
