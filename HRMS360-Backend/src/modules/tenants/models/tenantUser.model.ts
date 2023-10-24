import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Index,
  IsEmail,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Tenant } from "./tenant.model";
import { BaseModel } from "src/common/helpers";

@Table({
  tableName: "tenant_users",
  modelName: "TenantUser",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class TenantUser extends BaseModel {
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
    unique: {
      msg: "Admin with this email already exists!",
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

  @Column({
    type: DataType.STRING,
  })
  password: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_tenant_admin: boolean;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.STRING,
  })
  tenant_id: string;

  @BelongsTo(() => Tenant)
  my_tenant: Tenant;
}
