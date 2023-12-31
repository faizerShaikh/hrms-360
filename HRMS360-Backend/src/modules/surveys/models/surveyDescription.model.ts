import {
  AfterUpdate,
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
import { Questionnaire } from "src/modules/questionnaires/models";
import { Rater } from "src/modules/settings/modules/rater/models";
import { User } from "src/modules/users/models";
import { SurveyDescriptionStatus } from "../type";
import { Survey } from "./survey.model";

@Table({
  tableName: "survey_descriptions",
  modelName: "SurveyDescription",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class SurveyDescription extends BaseModel<SurveyDescription> {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: {
      msg: "Survey with this title already exists!",
      name: "uniqe-title",
    },
    validate: {
      notNull: {
        msg: "Title can not be empty",
      },
      notEmpty: {
        msg: "Title can not be empty",
      },
    },
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Description can not be empty",
      },
      notEmpty: {
        msg: "Description can not be empty",
      },
    },
  })
  description: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: SurveyDescriptionStatus.Initiated,
    validate: {
      ...enumValidator(
        Object.values(SurveyDescriptionStatus),
        "Survey description"
      ),
      notNull: {
        msg: "Survey description status can not be empty",
      },
      notEmpty: {
        msg: "Survey description status can not be empty",
      },
    },
  })
  status: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  previous_status: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  assessments_due: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  assessments_completed: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  total_assessments: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "End Date can not be empty",
      },
      notEmpty: {
        msg: "End Date can not be empty",
      },
    },
  })
  end_date: string;

  @Column({
    type: DataType.STRING,
    // allowNull: false,
    // validate: {
    //   notNull: {
    //     msg: "Respondant Cut Off Date can not be empty",
    //   },
    //   notEmpty: {
    //     msg: "Respondant Cut Off Date can not be empty",
    //   },
    // },
  })
  respondant_cut_off_date: string;

  @Column({
    type: DataType.STRING,
    // allowNull: false,
    // validate: {
    //   notNull: {
    //     msg: "LM approval cut off Date can not be empty",
    //   },
    //   notEmpty: {
    //     msg: "LM approval cut off Date can not be empty",
    //   },
    // },
  })
  lm_approval_cut_off_date: string;

  @Column({
    type: DataType.STRING,
  })
  response_form: string;

  @ForeignKey(() => Questionnaire)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Questionnaire ID can not be empty",
      },
      notEmpty: {
        msg: "Questionnaire ID can not be empty",
      },
    },
  })
  questionnaire_id: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  is_lm_approval_required: boolean;

  @BelongsTo(() => Questionnaire)
  questionnaire: Questionnaire;

  @HasMany(() => Survey, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  surveys: Survey[];

  @BelongsToMany(() => User, () => Survey)
  employees: User[];

  @HasMany(() => Rater, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    hooks: true,
  })
  raters: Rater[];

  // @AfterUpdate
  // static async checkStatus(instance: SurveyDescription) {
  //   const previousValues = await instance.previous();

  //   if (previousValues?.status) {
  //     // instance.previous_status = previousValues?.status;
  //     instance.update({
  //       previous_status: previousValues?.status,
  //     });
  //   }
  // }
}
