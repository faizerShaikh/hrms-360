import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  HasOne,
  Index,
  IsEmail,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from "sequelize-typescript";
import { Rater } from "src/modules/settings/modules/rater/models";
import { SurveyDescription } from "src/modules/surveys/models";
import { Survey } from "src/modules/surveys/models/survey.model";
import { SurveyRespondant } from "src/modules/surveys/models/surveyRespondants.model";
import { Department } from "../../settings/modules/department/models";
import { Designation } from "../../settings/modules/designation/models";
import { BaseModel } from "src/common/helpers";

@Table({
  tableName: "users",
  modelName: "User",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
  paranoid: true,
  timestamps: true,
})
export class User extends BaseModel {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @Column({
    type: DataType.STRING,
  })
  employee_code: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Name can not be empty",
      },
      notEmpty: {
        msg: "Name can not be empty",
      },
    },
  })
  name: string;

  @Column({
    type: DataType.STRING,
    // allowNull: false,
    // validate: {
    //   notNull: {
    //     msg: "Region can not be empty",
    //   },
    //   notEmpty: {
    //     msg: "Region can not be empty",
    //   },
    // },
  })
  region: string;

  @IsEmail
  @Unique({
    msg: "User with this email already exists!",
    name: "uniqe-email",
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: {
      msg: "User with this email already exists!",
      name: "uniqe-email",
    },
    validate: {
      notNull: {
        msg: "Email can not be empty",
      },
      notEmpty: {
        msg: "Email can not be empty",
      },
    },
  })
  email: string;

  @Column({ type: DataType.STRING })
  contact: string;

  @Column({ type: DataType.STRING })
  password: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  is_active: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_tenant_admin: boolean;

  @Column({
    type: DataType.STRING,
  })
  tenant_id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
  })
  line_manager_id: string;

  @HasMany(() => User, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
    foreignKey: "line_manager_id",
  })
  subordinates: User;

  @BelongsTo(() => User, "line_manager_id")
  line_manager: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
  })
  secondary_line_manager_id: string;

  @HasMany(() => User, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
    foreignKey: "secondary_line_manager_id",
  })
  secondary_subordinates: User;

  @BelongsTo(() => User, "secondary_line_manager_id")
  secondary_line_manager: User;

  @Column({
    type: DataType.STRING,
  })
  @ForeignKey(() => Department)
  department_id: string;

  @BelongsTo(() => Department)
  department: Department;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    // validate: {
    //   notNull: {
    //     msg: "Designation can not be empty",
    //   },
    //   notEmpty: {
    //     msg: "Designation can not be empty",
    //   },
    // },
  })
  @ForeignKey(() => Designation)
  designation_id: string;

  @BelongsTo(() => Designation)
  designation: Designation;

  @HasMany(() => Survey, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  surveys: Survey[];

  @BelongsToMany(() => SurveyDescription, () => Survey)
  surveyDescriptions: SurveyDescription[];

  @HasOne(() => SurveyRespondant, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  respondant: SurveyRespondant;

  @HasOne(() => SurveyRespondant, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  alternative_suggestion: SurveyRespondant;

  @BelongsToMany(() => Rater, {
    through: {
      model: () => SurveyRespondant,
      unique: false,
    },
  })
  raters: Rater[];
}
