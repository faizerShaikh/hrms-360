import {
  BelongsToMany,
  Column,
  DataType,
  Default,
  HasMany,
  Index,
  IsUUID,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { enumValidator, BaseModel } from "src/common/helpers";
import { Questionnaire } from "src/modules/questionnaires/models/questionnaire.model";
import { QuestionnaireCompetency } from "src/modules/questionnaires/models/questionnaireCompetency.model";
import { Question } from "src/modules/competencies/modules/questions/models";
import { CompetencyTypeOptions } from "../types";
import { CompetencyComment } from "src/modules/surveys/models";

@Table({
  tableName: "competencies",
  modelName: "Competency",

  defaultScope: {
    where: {
      is_copy: false,
    },
    order: [["createdAt", "DESC"]],
  },
})
export class Competency extends BaseModel<Competency> {
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
        msg: "Competency title can not be empty",
      },
      notEmpty: {
        msg: "Competency title can not be empty",
      },
    },
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Competency description can not be empty",
      },
      notEmpty: {
        msg: "Competency description can not be empty",
      },
    },
  })
  description: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      ...enumValidator(Object.values(CompetencyTypeOptions), "Competency Type"),
      notNull: {
        msg: "Competency type can not be empty",
      },
      notEmpty: {
        msg: "Competency type can not be empty",
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

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: "No of questions must be greater then or equal to 0",
      },
    },
  })
  benchmark: number;

  @Column(DataType.STRING)
  tenant_id: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_copy: boolean;

  @HasMany(() => Question, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  questions: Question[];

  @BelongsToMany(() => Questionnaire, () => QuestionnaireCompetency)
  questionnaires: Questionnaire[];

  @HasMany(() => CompetencyComment)
  comments: CompetencyComment[];
}
