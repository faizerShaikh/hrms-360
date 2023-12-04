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
import { StandardQuestion } from "./standardQuestion.model";

@Table({
  tableName: "standard_question_area_assessments",
  modelName: "StandardQuestionAreaAssessment",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class StandardQuestionAreaAssessment extends BaseModel {
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
  @ForeignKey(() => StandardQuestion)
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

  @BelongsTo(() => StandardQuestion)
  questions: StandardQuestion;
}
