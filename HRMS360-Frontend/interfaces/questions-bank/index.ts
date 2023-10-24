import {
  CompetencyInterface,
  QuestionInterface,
} from "interfaces/competency-bank";
import { BaseObjInterface } from "../base";

export interface QuestionnaireInterface extends BaseObjInterface {
  title: string;
  description: string;
  no_of_questions?: number;
  competencies?: Array<CompetencyInterface>;
  questions?: Array<QuestionInterface>;
  
}
