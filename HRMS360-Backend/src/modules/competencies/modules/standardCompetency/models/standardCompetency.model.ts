import {
  Column,
  DataType,
  Default,
  HasMany,
  Index,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { BaseModel, enumValidator } from "src/common/helpers";
import { CompetencyTypeOptions } from "src/modules/competencies/types";
import { StandardQuestion } from "../modules/standardQuestions/models";

@Table({
  tableName: "standard_competencies",
  modelName: "StandardCompetency",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class StandardCompetency extends BaseModel {
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
        msg: "Standard Competency title can not be empty",
      },
      notEmpty: {
        msg: "Standard Competency title can not be empty",
      },
    },
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Standard Competency description can not be empty",
      },
      notEmpty: {
        msg: "Standard Competency description can not be empty",
      },
    },
  })
  description: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      ...enumValidator(
        Object.values(CompetencyTypeOptions),
        "Standard Competency Type"
      ),
      notNull: {
        msg: "Standard Competency type can not be empty",
      },
      notEmpty: {
        msg: "Standard Competency type can not be empty",
      },
    },
  })
  type: CompetencyTypeOptions;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: "No of questions must be greater then or equal to 0",
      },
    },
  })
  no_of_questions: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  order: number;

  @Column(DataType.STRING)
  tenant_id: string;

  @HasMany(() => StandardQuestion, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  questions: StandardQuestion[];
}
