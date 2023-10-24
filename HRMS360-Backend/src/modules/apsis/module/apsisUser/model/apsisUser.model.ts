import { Model } from "sequelize-typescript";
import {
  Column,
  DataType,
  Default,
  IsEmail,
  IsUUID,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { BaseModel } from "src/common/helpers";

@Table({
  tableName: "apsis_users",
  modelName: "ApsisUser",
})
export class ApsisUser extends BaseModel {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @IsEmail
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: {
      msg: "User with this email already exists!",
      name: "uniqe-email",
    },
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;
}
