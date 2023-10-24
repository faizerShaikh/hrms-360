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
import { QuestionResponseOptions } from "src/modules/competencies/modules/questions/types";
import { ResponseGroup } from "./responseGroup.model";
import { BaseModel } from "src/common/helpers";

@Table({
  tableName: "standard_responses",
  modelName: "StandardResponse",
  defaultScope: {
    order: [["score", "DESC"]],
  },
})
export class StandardResponse extends BaseModel {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: QuestionResponseOptions.likert_scale,
  })
  type: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  label: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  score: number;

  @ForeignKey(() => ResponseGroup)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  group_id: string;

  @BelongsTo(() => ResponseGroup)
  responseGroup: ResponseGroup;
}
