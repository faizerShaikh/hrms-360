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
import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";
import { Question } from "./question.model";

@Table({
  tableName: "question_area_assessments",
  modelName: "QuestionAreaAssessment",
  defaultScope: {
    where: {
      is_copy: false,
    },
    order: [["createdAt", "DESC"]],
  },
})
export class QuestionAreaAssessment extends BaseModel<QuestionAreaAssessment> {
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
      notNull: {
        msg: "Question ID can not be empty",
      },
      notEmpty: {
        msg: "Question ID can not be empty",
      },
    },
  })
  @ForeignKey(() => Question)
  question_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Area Assessment ID can not be empty",
      },
      notEmpty: {
        msg: "Area Assessment ID can not be empty",
      },
    },
  })
  @ForeignKey(() => AreaAssessment)
  area_assessment_id: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_copy: boolean;

  @BelongsTo(() => Question)
  questions: Question;
}
