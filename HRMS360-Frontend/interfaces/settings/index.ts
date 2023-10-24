import { SurveyExternalRespondantInterface } from "interfaces/survey";
import { EmployeeInterface, SurveyResponse } from "..";
import { BaseObjInterface } from "../base";

export interface RaterInterface extends BaseObjInterface {
  category_name: string;
  name?: string;
  short_name?: string;
  no_of_raters: number;
  is_required: boolean;
  can_be_deleted?: boolean;
  is_external?: boolean;
  users?: EmployeeInterface[];
  surveyExternalRespondant?: SurveyExternalRespondantInterface[];
  responses?: SurveyResponse[];
}

export interface EmployeeDesignationInterface extends BaseObjInterface {
  name: string;
}

export interface DepartmentInterface extends BaseObjInterface {
  name: string;
}

export interface AssessmentAreaInterface extends BaseObjInterface {
  name: string;
  tenant_id?: string;
  is_deleted?: boolean;
  id?: string;
  value?: string;
}
export interface IndustryInterface extends AssessmentAreaInterface {}
