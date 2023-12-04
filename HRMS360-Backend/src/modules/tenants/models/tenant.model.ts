import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  HasOne,
  Index,
  IsUUID,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { enumValidator, BaseModel } from "src/common/helpers";
import { Industry } from "src/modules/settings/modules/industry/models";
import { AdminTypeOptions } from "../types";
import { TenantHistory } from "./tenantHistory.model";
import { TenantMetaData } from "./tenantMetaData.model";
import { TenantUser } from "./tenantUser.model";

@Table({
  tableName: "tenants",
  modelName: "Tenant",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
  paranoid: true,
  timestamps: true,
})
export class Tenant extends BaseModel<Tenant> {
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
    allowNull: false,
    validate: {
      notNull: {
        msg: "Schema name can not be empty",
      },
      notEmpty: {
        msg: "Schema name can not be empty",
      },
    },
  })
  schema_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Location can not be empty",
      },
      notEmpty: {
        msg: "Location can not be empty",
      },
    },
  })
  location: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Number of Employee can not be empty",
      },
      notEmpty: {
        msg: "Number of Employee can not be empty",
      },
    },
  })
  no_of_employee: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
    validate: {
      min: {
        args: [0],
        msg: "Atleast one employee should be there",
      },
    },
  })
  no_of_employee_created: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Start date can not be empty",
      },
      notEmpty: {
        msg: "Start date can not be empty",
      },
    },
  })
  start_date: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    validate: {
      notNull: {
        msg: "End date can not be empty",
      },
      notEmpty: {
        msg: "End date can not be empty",
      },
    },
  })
  end_date: string;

  @Column({ type: DataType.STRING })
  logo_path?: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Tenure can not be empty",
      },
      notEmpty: {
        msg: "Tenure can not be empty",
      },
    },
  })
  tenure: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_active: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_channel_partner: boolean;

  @Column({ type: DataType.STRING })
  tenant_pic: string;

  @Column({
    type: DataType.STRING,
    defaultValue: AdminTypeOptions.on_premise,
    validate: {
      ...enumValidator(Object.values(AdminTypeOptions), "Admin Type"),
    },
  })
  admin_type: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  is_lm_approval_required: boolean;

  @Column({
    type: DataType.STRING,
  })
  @ForeignKey(() => Industry)
  industry_id: string;

  @BelongsTo(() => Industry)
  industry: Industry;

  @Column({ type: DataType.STRING, defaultValue: false })
  admin_id: string;

  @HasMany(() => TenantUser, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  users: TenantUser[];

  @HasOne(() => TenantUser, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  admin: TenantUser;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.STRING })
  parent_tenant_id: string;

  @HasMany(() => Tenant, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  my_tenants: Tenant[];

  @BelongsTo(() => Tenant)
  parent_tenant: Tenant;

  @HasMany(() => TenantHistory)
  tenantHistory: TenantHistory[];

  @HasOne(() => TenantMetaData, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  tenantMetaData: TenantMetaData;
}
