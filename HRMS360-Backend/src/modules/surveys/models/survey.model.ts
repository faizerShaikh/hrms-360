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
import { Question } from "src/modules/competencies/modules/questions/models";
import { User } from "src/modules/users/models";
import { CompetencyComment } from ".";
import { SurveyStatus } from "../type";
import { SurveyDescription } from "./surveyDescription.model";
import { SurveyExternalRespondant } from "./surveyExternalRespondant.model";
import { SurveyRespondant } from "./surveyRespondants.model";
import { SurveyResponse } from "./surveyResponse.model";
import { CommentResponse } from "./commentResponse.model";

@Table({
  tableName: "surveys",
  modelName: "Survey",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class Survey extends BaseModel<Survey> {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @ForeignKey(() => SurveyDescription)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Survey ID can not be empty",
      },
      notEmpty: {
        msg: "Survey ID can not be empty",
      },
    },
  })
  survey_id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Employee ID can not be empty",
      },
      notEmpty: {
        msg: "Employee ID can not be empty",
      },
    },
  })
  employee_id: string;

  @Column({
    type: DataType.STRING,
  })
  report_path: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: SurveyStatus.Initiated,
    validate: {
      ...enumValidator(Object.values(SurveyStatus), "Survey status"),
      notNull: {
        msg: "Survey status can not be empty",
      },
      notEmpty: {
        msg: "Survey status can not be empty",
      },
    },
  })
  status: string;

  @Column({
    type: DataType.STRING,
    validate: {
      ...enumValidator(Object.values(SurveyStatus), "Survey description"),
    },
  })
  previous_status: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  no_of_respondents: number;

  @BelongsTo(() => SurveyDescription)
  survey_description: SurveyDescription;

  // Here the name is on which the join is to be made
  @BelongsTo(() => User)
  employee: User;

  @HasMany(() => SurveyRespondant, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  survey_respondants: SurveyRespondant[];

  @HasMany(() => SurveyResponse, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  surveyResponses: SurveyResponse[];

  @HasMany(() => SurveyExternalRespondant, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  survey_external_respondants: SurveyExternalRespondant[];

  @BelongsToMany(() => Question, {
    through: { model: () => SurveyResponse, unique: false },
  })
  questions: Question[];

  @HasMany(() => CompetencyComment, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  competencyComments: CompetencyComment[];

  @HasMany(() => CommentResponse, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  commentResponses: CommentResponse[];
}
