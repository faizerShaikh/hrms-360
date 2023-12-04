import {
  Column,
  DataType,
  Default,
  HasMany,
  Index,
  IsUUID,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { BaseModel } from "src/common/helpers";
import { Tenant } from "src/modules/tenants/models";

@Table({
  tableName: "industry",
  modelName: "Industry",
  paranoid: true,
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
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
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  tenants: Tenant[];
}
