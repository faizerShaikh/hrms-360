import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Index,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import {
  Question,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { Rater } from "src/modules/settings/modules/rater/models";
import { Survey } from "./survey.model";
import { SurveyExternalRespondant } from "./surveyExternalRespondant.model";
import { SurveyRespondant } from "./surveyRespondants.model";
import { BaseModel } from "src/common/helpers";

@Table({
  tableName: "survey_responses",
  modelName: "SurveyResponse",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class SurveyResponse extends BaseModel {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @ForeignKey(() => Survey)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  survey_id: string;

  @BelongsTo(() => Survey)
  survey: Survey;

  @Index
  @ForeignKey(() => SurveyRespondant)
  @Column({
    type: DataType.STRING,
  })
  survey_respondant_id: string;

  @ForeignKey(() => Question)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  question_id: string;

  @ForeignKey(() => QuestionResponse)
  @Column({
    type: DataType.STRING,
  })
  response_id: string;

  @ForeignKey(() => QuestionResponse)
  @Column({
    type: DataType.STRING,
  })
  expected_response_id: string;

  @Column({
    type: DataType.INTEGER,
  })
  gap: number;

  @Column({
    type: DataType.INTEGER,
  })
  actual_gap: number;

  @ForeignKey(() => Rater)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  category_id: string;

  @Column({ type: DataType.STRING(2000) })
  response_text: string;

  @ForeignKey(() => SurveyExternalRespondant)
  @Column({
    type: DataType.STRING,
  })
  survey_external_respondant_id: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  consider_in_report: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  is_dont_know: boolean;

  @BelongsTo(() => SurveyRespondant)
  survey_respondant: SurveyRespondant;

  @BelongsTo(() => Question, {
    foreignKey: "question_id",
  })
  question: Question;

  @BelongsTo(() => QuestionResponse, {
    foreignKey: "response_id",
  })
  response: QuestionResponse;

  @BelongsTo(() => QuestionResponse, {
    foreignKey: "expected_response_id",
  })
  expected_response: QuestionResponse;

  @BelongsTo(() => SurveyExternalRespondant)
  survey_external_respondant: SurveyExternalRespondant;

  @BelongsTo(() => Rater, "category_id")
  rater: Rater;
}
