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
import { StandardResponse } from "./standardResponse.model";
import { BaseModel } from "src/common/helpers";

@Table({
  tableName: "response_groups",
  modelName: "ResponseGroup",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class ResponseGroup extends BaseModel {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: {
      name: "title-unique",
      msg: "Response Grpup with this title already exists!",
    },
  })
  title: string;

  @HasMany(() => StandardResponse)
  responses: StandardResponse[];
}
