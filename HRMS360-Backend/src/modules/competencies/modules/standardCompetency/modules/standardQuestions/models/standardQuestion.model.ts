import {
  BelongsTo,
  BelongsToMany,
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
import { QuestionResponseOptions } from "src/modules/competencies/modules/questions/types";
import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";
import { StandardCompetency } from "../../../models";
import { StandardQuestionAreaAssessment } from "./standardQuestionAreasAssessment.model";

import { StandardQuestionResponse } from "./standardQuestionResponse.model";

@Table({
  tableName: "standard_questions",
  modelName: "StandardQuestion",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class StandardQuestion extends BaseModel {
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
        msg: "Text can not be empty",
      },
      notEmpty: {
        msg: "Text can not be empty",
      },
    },
  })
  text: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      ...enumValidator(Object.values(QuestionResponseOptions), "Response Type"),
      notNull: {
        msg: "Response Type can not be empty",
      },
      notEmpty: {
        msg: "Response Type can not be empty",
      },
    },
  })
  response_type: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Competency ID can not be empty",
      },
      notEmpty: {
        msg: "Competency ID can not be empty",
      },
    },
  })
  @ForeignKey(() => StandardCompetency)
  competency_id: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  max_score: number;

  @BelongsTo(() => StandardCompetency)
  competency: StandardCompetency;

  @HasMany(() => StandardQuestionResponse, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  responses: StandardQuestionResponse[];

  @BelongsToMany(() => AreaAssessment, () => StandardQuestionAreaAssessment)
  area_assessments: AreaAssessment[];

  @HasMany(() => StandardQuestionAreaAssessment, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  questionAreaAssessment: StandardQuestionAreaAssessment[];
}
