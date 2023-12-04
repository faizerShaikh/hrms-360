import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  HasOne,
  Index,
  IsEmail,
  IsUUID,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { enumValidator, BaseModel } from "src/common/helpers";
import { Rater } from "src/modules/settings/modules/rater/models";
import { SurveyRespondantStatus } from "../type";
import { CompetencyComment } from "./competencyComment.model";
import { Survey } from "./survey.model";
import { SurveyResponse } from "./surveyResponse.model";
import { SurveySuggestionsLogs } from "./surveySuggestionsLogs.model";

@Table({
  tableName: "survey_external_respondants",
  modelName: "SurveyExternalRespondant",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class SurveyExternalRespondant extends BaseModel<SurveyExternalRespondant> {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @ForeignKey(() => Survey)
  @Column
  survey_id: string;

  @BelongsTo(() => Survey)
  survey: Survey;

  @IsEmail
  @Column({ type: DataType.STRING, allowNull: false })
  respondant_email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  respondant_name: string;

  @ForeignKey(() => Rater)
  @Column({ type: DataType.STRING, allowNull: false })
  relationship_with_employee_id: string;

  @BelongsTo(() => Rater)
  rater: Rater;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_approved_by_employee: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_approved_by_line_manager: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: SurveyRespondantStatus.Initiated,
    validate: {
      ...enumValidator(
        Object.values(SurveyRespondantStatus),
        "External Survey Respondent"
      ),
      notNull: {
        msg: "External Survey Respondent status can not be empty",
      },
      notEmpty: {
        msg: "External Survey Respondent status can not be empty",
      },
    },
  })
  status: string;

  @Column({ type: DataType.DATE })
  response_date: string;

  @Column({ type: DataType.STRING })
  last_suggestion_id: string;

  @HasOne(() => SurveySuggestionsLogs)
  last_suggestion: SurveySuggestionsLogs;

  @HasMany(() => SurveyResponse, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  survey_response: SurveyResponse;

  @HasMany(() => CompetencyComment)
  comments: CompetencyComment[];
}
