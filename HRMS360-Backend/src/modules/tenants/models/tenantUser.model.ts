import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Index,
  IsEmail,
  IsUUID,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { BaseModel } from "src/common/helpers";
import { Tenant } from "./tenant.model";

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
