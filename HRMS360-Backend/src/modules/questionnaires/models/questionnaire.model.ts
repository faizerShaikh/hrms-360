import {
  BelongsToMany,
  Column,
  DataType,
  Default,
  HasMany,
  HasOne,
  Index,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Competency } from "src/modules/competencies/models";
import { Question } from "src/modules/competencies/modules/questions/models";
import { SurveyDescription } from "src/modules/surveys/models/surveyDescription.model";
import { QuestionnaireCompetency } from "./questionnaireCompetency.model";
import { QuestionnaireQuestion } from "./questionnaireQuestions.model";
import { BaseModel } from "src/common/helpers";

@Table({
  tableName: "questionnaires",
  modelName: "Questionnaire",
  defaultScope: {
    where: {
      is_copy: false,
    },
    order: [["createdAt", "DESC"]],
  },
})
export class Questionnaire extends BaseModel {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  title: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  description: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  no_of_questions: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_copy: boolean;

  @BelongsToMany(() => Competency, () => QuestionnaireCompetency)
  competencies: Competency[];

  @BelongsToMany(() => Question, () => QuestionnaireQuestion)
  questions: Question[];

  @HasOne(() => SurveyDescription, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  survey_description: SurveyDescription;

  @HasMany(() => QuestionnaireQuestion, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  questionnaireQuestion: QuestionnaireQuestion[];

  @HasMany(() => QuestionnaireCompetency, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  questionnaireCompetencies: QuestionnaireCompetency[];
}
