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
  tableName: "comment_responses",
  modelName: "CommentResponse",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class CommentResponse extends BaseModel {
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
  survey_respondent_id: string;

  @Column({ type: DataType.STRING(2000) })
  response_text: string;

  @Column({ type: DataType.STRING(2000) })
  question_type: string;

  @ForeignKey(() => SurveyExternalRespondant)
  @Column({
    type: DataType.STRING,
  })
  survey_external_respondent_id: string;

  @BelongsTo(() => SurveyRespondant)
  survey_respondant: SurveyRespondant;

  // @BelongsTo(() => Question, {
  //   foreignKey: "question_id",
  // })
  // question: Question;

  // @BelongsTo(() => QuestionResponse, {
  //   foreignKey: "response_id",
  // })
  // response: QuestionResponse;

  // @BelongsTo(() => QuestionResponse, {
  //   foreignKey: "expected_response_id",
  // })
  // expected_response: QuestionResponse;

  @BelongsTo(() => SurveyExternalRespondant)
  survey_external_respondant: SurveyExternalRespondant;

  @BelongsTo(() => Rater, "category_id")
  rater: Rater;
}
