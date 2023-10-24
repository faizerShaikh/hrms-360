import {
  Column,
  DataType,
  Default,
  ForeignKey,
  Index,
  IsUUID,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
} from "sequelize-typescript";
import { Competency } from "src/modules/competencies/models";
import { Survey, SurveyExternalRespondant, SurveyRespondant } from ".";
import { BaseModel } from "src/common/helpers";

@Table({
  tableName: "competency_comments",
  modelName: "CompetencyComment",
})
export class CompetencyComment extends BaseModel<CompetencyComment> {
  @Index
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @ForeignKey(() => Competency)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  competency_id: string;

  @ForeignKey(() => Survey)
  @Column({
    type: DataType.STRING,
  })
  survey_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  comments: string;

  @ForeignKey(() => SurveyRespondant)
  @Column({
    type: DataType.STRING,
  })
  survey_respondent_id?: string;

  @ForeignKey(() => SurveyExternalRespondant)
  @Column({
    type: DataType.STRING,
  })
  survey_external_respondent_id?: string;

  @BelongsTo(() => Competency)
  competency: Competency;

  @BelongsTo(() => SurveyRespondant)
  survey_respondent: SurveyRespondant;

  @BelongsTo(() => SurveyExternalRespondant)
  survey_external_respondent: SurveyExternalRespondant;

  @BelongsTo(() => Survey)
  survey: Survey;
}
