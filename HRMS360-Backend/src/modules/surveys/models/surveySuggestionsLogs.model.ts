import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Index,
  IsUUID,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { BaseModel } from "src/common/helpers";
import { User } from "src/modules/users/models";
import { SurveyExternalRespondant } from ".";
import { SurveyRespondant } from "./surveyRespondants.model";

@Table({
  tableName: "survey_approval_rejection_logs",
  modelName: "SurveySuggestionsLogs",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class SurveySuggestionsLogs extends BaseModel<SurveySuggestionsLogs> {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING })
  alternative_suggestion_id: string;

  @Column({ type: DataType.STRING })
  comments: string;

  @Column({ type: DataType.STRING })
  alternative_email: string;

  @Column({ type: DataType.STRING })
  alternative_name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  suggested_by: string;

  @ForeignKey(() => SurveyRespondant)
  @Column({ type: DataType.STRING })
  survey_respondant_id: string;

  @ForeignKey(() => SurveyExternalRespondant)
  @Column({ type: DataType.STRING })
  external_survey_respondant_id: string;

  @BelongsTo(() => SurveyRespondant)
  surveyRespondant: SurveyRespondant;

  @BelongsTo(() => SurveyExternalRespondant)
  surveyExternalRespondant: SurveyExternalRespondant;

  @BelongsTo(() => User)
  user: User;
}
