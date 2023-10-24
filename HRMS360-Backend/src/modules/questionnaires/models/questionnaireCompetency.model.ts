import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Index,
  IsUUID,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Competency } from "src/modules/competencies/models";
import { Questionnaire } from "./questionnaire.model";
import { BaseModel } from "src/common/helpers";

@Table({
  tableName: "questionnaire_competency",
  modelName: "QuestionnaireCompetency",
  defaultScope: {
    where: {
      is_copy: false,
    },
    order: [["createdAt", "DESC"]],
  },
})
export class QuestionnaireCompetency extends BaseModel<QuestionnaireCompetency> {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @Column
  @ForeignKey(() => Questionnaire)
  questionnaire_id: string;

  @Column
  @ForeignKey(() => Competency)
  competency_id: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  no_of_questions: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_copy: boolean;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  order: number;

  @BelongsTo(() => Competency)
  competency: Competency;

  @BelongsTo(() => Questionnaire)
  questionnaire: Questionnaire;
}
