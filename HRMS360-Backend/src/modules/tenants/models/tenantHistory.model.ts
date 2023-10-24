import { DataTypes } from "sequelize";
import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Index,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { BaseModel, enumValidator } from "src/common/helpers";
import { TenantHistoryGroup, TenantHistoryTypes } from "../types";
import { Tenant } from "./tenant.model";

@Table({
  tableName: "tenant_history",
  modelName: "TenantHistory",
  timestamps: true,
})
export class TenantHistory extends BaseModel {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      ...enumValidator(
        Object.values(TenantHistoryTypes),
        "Tenant History Type"
      ),
      notNull: {
        msg: "Type can not be empty",
      },
      notEmpty: {
        msg: "Type can not be empty",
      },
    },
  })
  type: TenantHistoryTypes;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataTypes.STRING,
  })
  tenant_id: string;

  @Column({
    type: DataTypes.STRING,
  })
  reference_id: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      ...enumValidator(
        Object.values(TenantHistoryGroup),
        "Tenant History Group"
      ),
      // notNull: {
      //   msg: 'Group can not be empty',
      // },
      // notEmpty: {
      //   msg: 'Group can not be empty',
      // },
    },
  })
  group: TenantHistoryGroup;

  @BelongsTo(() => Tenant)
  tenant: Tenant;
}
