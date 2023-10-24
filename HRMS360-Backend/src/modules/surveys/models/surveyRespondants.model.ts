import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  HasOne,
  Index,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { BaseModel, enumValidator } from "src/common/helpers";
import { Rater } from "src/modules/settings/modules/rater/models";
import { User } from "src/modules/users/models";
import { SurveyRespondantStatus } from "../type";
import { Survey } from "./survey.model";
import { SurveySuggestionsLogs } from "./surveySuggestionsLogs.model";
import { SurveyResponse } from "./surveyResponse.model";
import { CompetencyComment } from ".";

@Table({
  tableName: "survey_respondants",
  modelName: "SurveyRespondant",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
  indexes: [
    {
      name: "survey_respondent_unique",
      unique: true,
      fields: ["survey_id", "respondant_id"],
    },
    {
      name: "survey_respondent_relation_unique",
      unique: true,
      fields: ["survey_id", "respondant_id", "relationship_with_employee_id"],
    },
  ],
})
export class SurveyRespondant extends BaseModel {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @ForeignKey(() => Survey)
  @Column({ type: DataType.STRING, allowNull: false })
  survey_id: string;

  @BelongsTo(() => Survey)
  survey: Survey;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING })
  respondant_id: string;

  @BelongsTo(() => User)
  respondant: User;

  @ForeignKey(() => Rater)
  @Column({ type: DataType.STRING })
  relationship_with_employee_id: string;

  @Column({ type: DataType.BOOLEAN })
  is_recipient: boolean;

  @BelongsTo(() => Rater)
  rater: Rater;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: SurveyRespondantStatus.Initiated,
    validate: {
      ...enumValidator(
        Object.values(SurveyRespondantStatus),
        "Survey Respondent"
      ),
      notNull: {
        msg: "Survey Respondent status can not be empty",
      },
      notEmpty: {
        msg: "Survey Respondent status can not be empty",
      },
    },
  })
  status: string;

  @Column({ type: DataType.DATE })
  response_date: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_selected_by_system: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_approved_by_employee: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_approved_by_line_manager: boolean;

  @Column({ type: DataType.STRING })
  last_suggestion_id: string;

  @HasOne(() => SurveySuggestionsLogs)
  last_suggestion: SurveySuggestionsLogs;

  @HasMany(() => SurveySuggestionsLogs)
  logs: SurveySuggestionsLogs[];

  @HasMany(() => SurveyResponse, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  survey_responses: SurveyResponse[];

  @HasMany(() => CompetencyComment, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  comments: CompetencyComment[];
}
