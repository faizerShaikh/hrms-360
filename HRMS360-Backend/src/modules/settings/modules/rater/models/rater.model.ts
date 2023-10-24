import {
  Column,
  DataType,
  Default,
  Index,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  HasMany,
  BelongsToMany,
  Unique,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { BaseModel } from "src/common/helpers";
import { Question } from "src/modules/competencies/modules/questions/models";
import {
  SurveyDescription,
  SurveyExternalRespondant,
  SurveyRespondant,
  SurveyResponse,
} from "src/modules/surveys/models";
import { User } from "src/modules/users/models";

@Table({
  tableName: "raters",
  modelName: "Rater",
  paranoid: true,
  defaultScope: {
    order: [["order", "ASC"]],
  },
})
export class Rater extends BaseModel<Rater> {
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
        msg: "Category name can not be empty",
      },
      notEmpty: {
        msg: "Category name can not be empty",
      },
    },
  })
  category_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "name can not be empty",
      },
      notEmpty: {
        msg: "name can not be empty",
      },
    },
  })
  name: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  order: number;

  // @Column({
  //   type: DataType.INTEGER,
  //   defaultValue: 0,
  // })
  // color: number;

  @Column({
    type: DataType.STRING,
    validate: {
      len: {
        msg: "Short name must be between 1 to 5 characters",
        args: [1, 5],
      },
    },
  })
  short_name: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Number of raters can not be empty",
      },
      notEmpty: {
        msg: "Number of raters can not be empty",
      },
    },
  })
  no_of_raters: number;

  // @Column({
  //   type: DataType.BOOLEAN,
  //   defaultValue: true,
  // })
  // is_required: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  can_be_deleted: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_external: boolean;

  @ForeignKey(() => SurveyDescription)
  @Column({
    type: DataType.STRING,
  })
  survey_description_id: string;

  @BelongsTo(() => SurveyDescription)
  survey_description: SurveyDescription;

  @HasMany(() => SurveyRespondant, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    hooks: true,
  })
  surveyRespondant: SurveyRespondant[];

  @HasMany(() => SurveyExternalRespondant, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    hooks: true,
  })
  surveyExternalRespondant: SurveyExternalRespondant[];

  @BelongsToMany(() => User, {
    through: {
      model: () => SurveyRespondant,
      unique: false,
    },
  })
  users: User[];

  @BelongsToMany(() => Question, {
    through: {
      model: () => SurveyResponse,
      unique: false,
    },
  })
  questions: Question[];

  @HasMany(() => SurveyResponse)
  responses: SurveyResponse[];
}
