import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from "sequelize-typescript";
import { enumValidator, BaseModel } from "src/common/helpers";
import { ResponseFormOptions } from "src/modules/surveys/type";
import { Tenant } from "./tenant.model";

@Table({
  tableName: "tenant_meta_deta",
  modelName: "TenantMetaData",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class TenantMetaData extends BaseModel<TenantMetaData> {
  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.STRING,
  })
  tenant_id: string;

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
    defaultValue: ResponseFormOptions.Single_Ratee,
    validate: {
      ...enumValidator(Object.values(ResponseFormOptions), "Response Form"),
    },
  })
  response_form: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: true,
  })
  total_tenants: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: true,
  })
  active_tenant_count: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: true,
  })
  inactive_tenant_count: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: true,
  })
  total_users_onboarded: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: true,
  })
  surveys_launched_count: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: true,
  })
  surveys_ongoing_count: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: true,
  })
  surveys_completed_count: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: true,
  })
  surveys_terminated_count: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: true,
  })
  ratee_count: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: true,
  })
  rater_count: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;
}
