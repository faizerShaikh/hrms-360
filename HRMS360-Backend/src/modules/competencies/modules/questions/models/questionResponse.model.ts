import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Index,
  IsUUID,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { enumValidator, BaseModel } from "src/common/helpers";
import { SurveyResponse } from "src/modules/surveys/models/surveyResponse.model";
import { QuestionResponseOptions } from "../types";
import { Question } from "./question.model";

@Table({
  tableName: "question_responses",
  modelName: "QuestionResponse",
  paranoid: true,
  defaultScope: {
    where: {
      is_copy: false,
    },
    order: [
      ["order", "DESC"],
      ["score", "DESC"],
    ],
  },
})
export class QuestionResponse extends BaseModel {
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
  @ForeignKey(() => Question)
  question_id: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_copy: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_standard: boolean;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  order: number;

  @BelongsTo(() => Question)
  question: Question;

  @HasMany(() => SurveyResponse, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  surver_responses: SurveyResponse[];
}
