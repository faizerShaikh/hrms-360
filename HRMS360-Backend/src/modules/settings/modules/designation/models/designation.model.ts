import {
  Column,
  DataType,
  Default,
  HasMany,
  Index,
  IsUUID,
  PrimaryKey,
  Table,
  Unique,
} from "sequelize-typescript";
import { BaseModel } from "src/common/helpers";
import { User } from "src/modules/users/models";

@Table({
  tableName: "designations",
  modelName: "Designation",
  paranoid: true,
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class Designation extends BaseModel {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @Unique({
    msg: "This designation already exists!",
    name: "unique-designation",
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: {
      msg: "This designation already exists!",
      name: "unique-designation",
    },
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

  @HasMany(() => User, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  users: User[];
}
