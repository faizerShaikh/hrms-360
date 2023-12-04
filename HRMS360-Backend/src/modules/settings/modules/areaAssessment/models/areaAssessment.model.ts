import {
  BelongsToMany,
  Column,
  DataType,
  Default,
  Index,
  IsUUID,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { BaseModel } from "src/common/helpers";
import { Question } from "src/modules/competencies/modules/questions/models";
import { QuestionAreaAssessment } from "src/modules/competencies/modules/questions/models/questionAreasAssessment.model";

@Table({
  tableName: "assessment_areas",
  modelName: "AreaAssessment",
  paranoid: true,
  defaultScope: {
    where: {
      is_copy: false,
    },
    order: [["createdAt", "DESC"]],
  },
})
export class AreaAssessment extends BaseModel {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
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

  @Column({ type: DataType.STRING })
  tenant_id?: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_copy: boolean;

  @BelongsToMany(() => Question, () => QuestionAreaAssessment)
  questions: Question[];
}
