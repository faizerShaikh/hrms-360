import { config } from "dotenv";
config();

export const DB_PUBLIC_SCHEMA = process.env.DB_PUBLIC_SCHEMA || "public";

export const commonAttrubutesToExclude = {
  exclude: ["updatedAt"],
};

export const publicModels = [
  "Industry",
  "Tenant",
  "TenantUser",
  "ApsisUser",
  "TenantHistory",
  "TenantMetaData",
  "StandardCompetency",
  "StandardQuestion",
  "StandardQuestionAreaAssessment",
  "StandardQuestionResponse",
];

export const commonModels = ["AreaAssessment"];

export const userExcelColumnsMap = {
  1: "name",
  2: "email",
  3: "designation_id",
  4: "department_id",
  5: "contact",
  6: "region",
  7: "designation_name",
  8: "department_name",
};

export let responseTypes = {
  "Likert Scale": "likert_scale",
  "Text": "text",
  "Single Choice": "single_choice",
  "Yes/No": "yes_no",
  "Multiple Choice": "multiple_choice",
};
