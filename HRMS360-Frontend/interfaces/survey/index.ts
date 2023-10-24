import {
  EmployeeInterface,
  BaseObjInterface,
  RaterInterface,
  QuestionnaireInterface,
} from "..";

export interface SelectRecipientsInterfcae {
  employees?: EmployeeInterface[];
  onChange: (
    checked: boolean,
    emp: EmployeeInterface | EmployeeInterface[]
  ) => void;
}

export interface SurveyInterface extends BaseObjInterface {
  survey_id: string;
  employee_id: string;
  status: string;
  employee: EmployeeInterface;
  no_of_respondents: number;
  survey_respondants: SurveyRespondantInterface[];
  survey_external_respondants: SurveyExternalRespondantInterface[];
  surveyResponses: SurveyResponseInterface[];
  survey_respondant_id?: string;
  survey_external_respondant_id?: string;
}

export interface SurveyDescriptionInterface extends BaseObjInterface {
  title: string;
  description: string;
  questionnaire_id: string;
  status?: string;
  end_date: string;
  respondant_cut_off_date: string;
  lm_approval_cut_off_date: string;
  assessments_completed?: number;
  assessments_due?: number;
  employees?: Array<EmployeeInterface>;
  employeeIds?: Array<string>;
  surveys?: SurveyInterface[];
  questionnaire?: QuestionnaireInterface;
  is_lm_approval_required?: boolean;
}

export interface SurveyExternalRespondantInterface extends BaseObjInterface {
  survey_id?: string;
  respondant_email: string;
  respondant_name: string;
  is_approved_by_employee?: boolean;
  is_approved_by_line_manager?: boolean;
  relationship_with_employee_id?: string;
  status?: string;
  response_date?: string;
  last_suggestion?: SurveyApprovalRejectionLogs;
  logs: SurveyApprovalRejectionLogs[];
  rater: RaterInterface;
}

export interface SurveyRespondantInterface extends BaseObjInterface {
  survey_id?: string;
  respondant_id: string;
  is_approved_by_employee?: boolean;
  is_approved_by_line_manager?: boolean;
  relationship_with_employee_id?: string;
  is_selected_by_system: boolean;
  status?: string;
  response_date?: string;
  last_suggestion_id?: string;
  last_suggestion?: SurveyApprovalRejectionLogs;
  logs: SurveyApprovalRejectionLogs[];
  rater?: RaterInterface;
}

export interface SurveyApprovalRejectionLogs extends BaseObjInterface {
  alternative_suggestion_id?: string;
  comments?: string;
  suggested_by?: string;
  survey_respondant_id?: string;
  external_survey_respondant_id?: string;
  user?: EmployeeInterface;
  alternative_email?: string;
  alternative_name?: string;
}

export interface PendingNominationInterface extends RaterInterface {
  selectedRaters: number;
  raters: Array<EmployeeInterface & Partial<SurveyRespondantInterface>>;
  externalRespondents: Array<SurveyExternalRespondantInterface>;
}

export interface nominationInitialStateInterface {
  raters: PendingNominationInterface[];
  users: EmployeeInterface[];
  userIds: Array<string>;
}

export enum SurveyStatus {
  Initiated = "Initiated",
  In_Progress = "In Progress",
  Suggested_by_LM = "Suggested By Line Manager",
  Suggested_by_EMP = "Suggested By Employee",
  Ongoing = "Ongoing",
  Completed = "Completed",
}

export interface SurveyAssessmentInterface extends BaseObjInterface {
  status: string;
  employee: EmployeeInterface;
  survey_description: SurveyDescriptionInterface;
}

export interface SurveyResponseInterface {
  response_id: string;
  response_ids: Array<string>;
  response_text: string;
  consider_in_report: boolean;
  question_id: string;
  question_type: string;
  is_answerd?: boolean;
}
