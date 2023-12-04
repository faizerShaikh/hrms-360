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
import { enumValidator, BaseModel } from "src/common/helpers";
import { QuestionResponseOptions } from "src/modules/competencies/modules/questions/types";
import { StandardQuestion } from "./standardQuestion.model";

@Table({
  tableName: "standard_question_responses",
  modelName: "StandardQuestionResponse",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class StandardQuestionResponse extends BaseModel {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      ...enumValidator(
        Object.values(QuestionResponseOptions),
        "Question Response Type"
      ),
    },
  })
  type: QuestionResponseOptions;

  @Column({
    type: DataType.STRING,
  })
  label: string;

  @Column({
    type: DataType.INTEGER,
  })
  score: number;

  @Column({
    type: DataType.STRING,
  })
  @ForeignKey(() => StandardQuestion)
  question_id: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  order: number;

  @BelongsTo(() => StandardQuestion)
  question: StandardQuestion;
}
