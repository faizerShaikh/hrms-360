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
} from "sequelize-typescript";
import { BaseModel } from "src/common/helpers";
import { Tenant } from "src/modules/tenants/models";

@Table({
  tableName: "industry",
  modelName: "Industry",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
  indexes: [{ fields: ["name", "tenant_id"], unique: true }],
})
export class Industry extends BaseModel<Industry> {
  @Index
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Industry name can not be empty",
      },
      notEmpty: {
        msg: "Industry name can not be empty",
      },
    },
  })
  name: string;

  @Column({
    type: DataType.STRING,
  })
  tenant_id: string;

  @HasMany(() => Tenant, {
    onDelete: "SET NULL",
    hooks: true,
  })
  tenants: Tenant[];
}
