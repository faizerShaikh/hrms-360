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
import {
  Question,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { Rater } from "src/modules/settings/modules/rater/models";
import { Survey } from "./survey.model";
import { SurveyExternalRespondant } from "./surveyExternalRespondant.model";
import { SurveyRespondant } from "./surveyRespondants.model";

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
  @Column
  survey_id: string;

  @BelongsTo(() => Survey)
  survey: Survey;

  @ForeignKey(() => SurveyRespondant)
  @Column
  survey_respondant_id: string;

  @ForeignKey(() => Question)
  @Column
  question_id: string;

  @ForeignKey(() => QuestionResponse)
  @Column
  response_id: string;

  @ForeignKey(() => Rater)
  @Column
  category_id: string;

  @Column({ type: DataType.STRING(2000), allowNull: false })
  response_text: string;

  @ForeignKey(() => SurveyExternalRespondant)
  @Column
  survey_external_respondant_id: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  consider_in_report: boolean;

  @BelongsTo(() => SurveyRespondant)
  survey_respondant: SurveyRespondant;

  @BelongsTo(() => Question)
  question: Question;

  @BelongsTo(() => QuestionResponse)
  response: QuestionResponse;

  @BelongsTo(() => SurveyExternalRespondant)
  survey_external_respondant: SurveyExternalRespondant;

  @BelongsTo(() => Rater, "category_id")
  rater: Rater;
}
