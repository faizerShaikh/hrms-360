import {
  Column,
  DataType,
  Default,
  Index,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { BaseModel } from "src/common/helpers";

@Table({
  tableName: "draft_surveys",
  modelName: "DraftSurvey",
  defaultScope: {
    order: [["createdAt", "DESC"]],
  },
})
export class DraftSurvey extends BaseModel<DraftSurvey> {
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
      msg: "Survey with this title already exists!",
      name: "uniqe-title",
    },
    validate: {
      notNull: {
        msg: "Title can not be empty",
      },
      notEmpty: {
        msg: "Title can not be empty",
      },
    },
  })
  title: string;

  @Column({
    type: DataType.STRING,
    // allowNull: false,
    // validate: {
    //   notNull: {
    //     msg: "Client Contact can not be empty",
    //   },
    //   notEmpty: {
    //     msg: "Client Contact can not be empty",
    //   },
    // },
  })
  client_contact: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Description can not be empty",
      },
      notEmpty: {
        msg: "Description can not be empty",
      },
    },
  })
  description: string;

  @Column({
    type: DataType.STRING,
  })
  date: string;

  @Column({
    type: DataType.JSON,
  })
  data: JSON;
}
