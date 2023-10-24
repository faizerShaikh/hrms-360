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
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { BaseModel, enumValidator } from "src/common/helpers";
import { Competency } from "src/modules/competencies/models";
import { Questionnaire } from "src/modules/questionnaires/models/questionnaire.model";
import { QuestionnaireQuestion } from "src/modules/questionnaires/models/questionnaireQuestions.model";
import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";
import { Rater } from "src/modules/settings/modules/rater/models";
import { Survey, SurveyResponse } from "src/modules/surveys/models";
import { QuestionResponseOptions } from "../types";
import { QuestionAreaAssessment } from "./questionAreasAssessment.model";
import { QuestionResponse } from "./questionResponse.model";

@Table({
  tableName: "questions",
  modelName: "Question",
  defaultScope: {
    where: {
      is_copy: false,
    },
    order: [["createdAt", "DESC"]],
  },
})
export class Question extends BaseModel {
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
  })
  regional_text: string;

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
  @ForeignKey(() => Competency)
  competency_id: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_copy: boolean;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  max_score: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  order: number;

  @Column({ type: DataType.FLOAT, defaultValue: 0 })
  avg_gap: number;

  @BelongsTo(() => Competency)
  competency: Competency;

  @HasMany(() => QuestionResponse, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  responses: QuestionResponse[];

  @HasMany(() => SurveyResponse, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  surveyResponses: SurveyResponse[];

  @HasMany(() => SurveyResponse, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  expectedSurveyResponses: SurveyResponse[];

  @HasMany(() => QuestionnaireQuestion, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  questionnaireQuestion: QuestionnaireQuestion[];

  @BelongsToMany(() => AreaAssessment, () => QuestionAreaAssessment)
  area_assessments: AreaAssessment[];

  @BelongsToMany(() => Questionnaire, () => QuestionnaireQuestion)
  questionnaires: Questionnaire[];

  @HasMany(() => QuestionAreaAssessment, {
    onDelete: "CASCADE",
    hooks: true,
  })
  questionAreaAssessment: QuestionAreaAssessment[];

  @BelongsToMany(() => Rater, {
    through: {
      model: () => SurveyResponse,
      unique: false,
    },
  })
  raters: Rater[];

  @BelongsToMany(() => Survey, {
    through: {
      model: () => SurveyResponse,
      unique: false,
    },
  })
  surveys: Survey[];
}
