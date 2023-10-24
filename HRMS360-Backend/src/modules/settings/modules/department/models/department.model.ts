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
  Unique,
} from "sequelize-typescript";
import { BaseModel } from "src/common/helpers";
import { User } from "src/modules/users/models";

@Table({
  tableName: "departments",
  modelName: "Department",
  paranoid: true,
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class Department extends BaseModel<Department> {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @Unique({
    msg: "This department name already exists!",
    name: "unique-department",
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: {
      msg: "This department name already exists!",
      name: "unique-department",
    },
    validate: {
      notNull: {
        msg: "Department Name can not be empty",
      },
      notEmpty: {
        msg: "Department Name can not be empty",
      },
    },
  })
  name: string;

  @HasMany(() => User, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  users: User[];
}
