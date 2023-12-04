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
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { BaseModel } from "src/common/helpers";
import { Rater } from "src/modules/settings/modules/rater/models";
import { SurveyDescription } from "src/modules/surveys/models";
import { Survey } from "src/modules/surveys/models/survey.model";
import { SurveyRespondant } from "src/modules/surveys/models/surveyRespondants.model";
import { Department } from "../../settings/modules/department/models";
import { Designation } from "../../settings/modules/designation/models";

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
  })
  region: string;

  @IsEmail
  @Column({
    type: DataType.STRING,
    allowNull: false,
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

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  is_lm_approval_required: boolean;

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
    allowNull: false,
    validate: {
      notNull: {
        msg: "Department can not be empty",
      },
      notEmpty: {
        msg: "Department can not be empty",
      },
    },
  })
  @ForeignKey(() => Department)
  department_id: string;

  @BelongsTo(() => Department)
  department: Department;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Designation can not be empty",
      },
      notEmpty: {
        msg: "Designation can not be empty",
      },
    },
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

  static _validateIncludedElements(options, tableNames) {
    if (!options.model) options.model = this;
    tableNames = tableNames || {};
    options.includeNames = [];
    options.includeMap = {};
    options.hasSingleAssociation = false;
    options.hasMultiAssociation = false;
    if (!options.parent) {
      options.topModel = options.model;
      options.topLimit = options.limit;
    }
    options.include = options.include.map((include) => {
      include = include.model._conformInclude(include);
      include = {
        ...include,
        model: include.model.schema(options.model._schema),
      };
      include.parent = options;
      include.topLimit = options.topLimit;
      include.model._validateIncludedElement.call(
        options.model,
        include,
        tableNames,
        options
      );
      if (include.duplicating === void 0) {
        include.duplicating = include.association.isMultiAssociation;
      }
      include.hasDuplicating = include.hasDuplicating || include.duplicating;
      include.hasRequired = include.hasRequired || include.required;
      options.hasDuplicating = options.hasDuplicating || include.hasDuplicating;
      options.hasRequired = options.hasRequired || include.required;
      options.hasWhere =
        options.hasWhere || include.hasWhere || !!include.where;
      return include;
    });
    for (const include of options.include) {
      include.hasParentWhere = options.hasParentWhere || !!options.where;
      include.hasParentRequired =
        options.hasParentRequired || !!options.required;
      if (
        include.subQuery !== false &&
        options.hasDuplicating &&
        options.topLimit
      ) {
        if (include.duplicating) {
          include.subQuery = include.subQuery || false;
          include.subQueryFilter = include.hasRequired;
        } else {
          include.subQuery = include.hasRequired;
          include.subQueryFilter = false;
        }
      } else {
        include.subQuery = include.subQuery || false;
        if (include.duplicating) {
          include.subQueryFilter = include.subQuery;
        } else {
          include.subQueryFilter = false;
          include.subQuery =
            include.subQuery ||
            (include.hasParentRequired &&
              include.hasRequired &&
              !include.separate);
        }
      }
      options.includeMap[include.as] = include;
      options.includeNames.push(include.as);
      if (
        options.topModel === options.model &&
        options.subQuery === void 0 &&
        options.topLimit
      ) {
        if (include.subQuery) {
          options.subQuery = include.subQuery;
        } else if (include.hasDuplicating) {
          options.subQuery = true;
        }
      }
      options.hasIncludeWhere =
        options.hasIncludeWhere || include.hasIncludeWhere || !!include.where;
      options.hasIncludeRequired =
        options.hasIncludeRequired ||
        include.hasIncludeRequired ||
        !!include.required;
      if (
        include.association.isMultiAssociation ||
        include.hasMultiAssociation
      ) {
        options.hasMultiAssociation = true;
      }
      if (
        include.association.isSingleAssociation ||
        include.hasSingleAssociation
      ) {
        options.hasSingleAssociation = true;
      }
    }
    if (options.topModel === options.model && options.subQuery === void 0) {
      options.subQuery = false;
    }
    return options;
  }
}
