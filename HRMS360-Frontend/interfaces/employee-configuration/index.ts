import { SurveyRespondantInterface } from "interfaces/survey";
import { EmployeeDesignationInterface, DepartmentInterface } from "..";
import { BaseObjInterface, FKBaseInterface } from "../base";

export interface EmployeeInterface extends BaseObjInterface {
  name: string;
  region: string;
  email: string;
  contact?: string;
  is_active: boolean;
  is_lm_approval_required?: boolean;
  line_manager_id?: FKBaseInterface;
  secondary_line_manager_id?: FKBaseInterface;
  department_id: FKBaseInterface;
  designation_id: FKBaseInterface;
  designation?: EmployeeDesignationInterface;
  department?: DepartmentInterface;
  line_manager?: EmployeeInterface;
  secondary_line_manager?: EmployeeInterface;
  SurveyRespondant?: SurveyRespondantInterface;
  respondant?: SurveyRespondantInterface;
}
