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
import { Question } from "src/modules/competencies/modules/questions/models";
import { Questionnaire } from "./questionnaire.model";
import { BaseModel } from "src/common/helpers";

@Table({
  tableName: "questionnaire_questions",
  modelName: "QuestionnaireQuestion",
  defaultScope: {
    where: {
      is_copy: false,
    },
    order: [["createdAt", "DESC"]],
  },
})
export class QuestionnaireQuestion extends BaseModel<QuestionnaireQuestion> {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @Column
  @ForeignKey(() => Questionnaire)
  questionnaire_id: string;

  @Column
  @ForeignKey(() => Question)
  question_id: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  order: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_copy: boolean;

  @BelongsTo(() => Question)
  question: Question;

  @BelongsTo(() => Questionnaire)
  questionnaire: Questionnaire;
}
