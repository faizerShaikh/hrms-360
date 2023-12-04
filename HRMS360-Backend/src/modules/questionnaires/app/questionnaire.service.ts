import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { Sequelize } from "sequelize-typescript";
import { commonAttrubutesToExclude } from "src/common/constants";
import { getSearchObject } from "src/common/helpers";
import { RequestParamsService } from "src/common/modules";
import { Competency } from "src/modules/competencies/models";
import {
  Question,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { CreateQuestionnaireDTO, UpdateQuestionnaireDTO } from "../dtos";
import {
  Questionnaire,
  QuestionnaireCompetency,
  QuestionnaireQuestion,
} from "../models";

@Injectable()
export class QuestionnaireService {
  constructor(
    @InjectModel(Questionnaire)
    private readonly questionnaire: typeof Questionnaire,
    @InjectModel(Question)
    private readonly question: typeof Question,
    @InjectModel(QuestionnaireCompetency)
    private readonly questionnaireCompetency: typeof QuestionnaireCompetency,
    @InjectModel(QuestionnaireQuestion)
    private readonly questionnaireQuestion: typeof QuestionnaireQuestion,
    private readonly requestParams: RequestParamsService,
    @InjectConnection() private readonly sequelize: Sequelize
  ) {}

  async createQuestionnaire(body: CreateQuestionnaireDTO) {
    const transaction = await this.sequelize.transaction();
    try {
      let no_of_questions = 0;
      const questionnaire = await this.questionnaire
        .schema(this.requestParams.schema_name)
        .create<Questionnaire>(
          {
            ...body,
            no_of_questions: 0,
          },
          { transaction }
        );

      let questions = [];

      const competencies = body.competencies.map((item) => {
        for (const question of item.questionIds) {
          questions.push({
            questionnaire_id: questionnaire.id,
            question_id: question,
          });
        }
        no_of_questions += item.questionIds.length;
        return {
          questionnaire_id: questionnaire.id,
          competency_id: item.id,
          no_of_questions: item.questionIds.length,
        };
      });

      await questionnaire.update({ no_of_questions }, { transaction });
      await this.questionnaireCompetency
        .schema(this.requestParams.schema_name)
        .bulkCreate(competencies, {
          transaction,
        });
      await this.questionnaireQuestion
        .schema(this.requestParams.schema_name)
        .bulkCreate(questions, { transaction });

      await transaction.commit();
      return questionnaire;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateQuestionnaire(body: UpdateQuestionnaireDTO, id: string) {
    const transaction = await this.sequelize.transaction();
    try {
      const questionnaire = await this.questionnaire
        .schema(this.requestParams.schema_name)
        .findOne<Questionnaire>({
          where: {
            id,
          },
        });

      if (!questionnaire)
        throw new NotFoundException("Questionnaire not found");

      let no_of_questions = 0;
      let questions = [];

      const competencies = body.competencies?.map((item) => {
        for (const question of item.questionIds) {
          questions.push({
            questionnaire_id: questionnaire.id,
            question_id: question,
          });
        }
        no_of_questions += item.questionIds.length;
        return {
          questionnaire_id: questionnaire.id,
          competency_id: item.id,
          no_of_questions: item.questionIds.length,
        };
      });

      await questionnaire.update(
        {
          ...body,
          no_of_questions: no_of_questions
            ? no_of_questions
            : questionnaire.no_of_questions,
        },
        { transaction }
      );

      if (competencies?.length) {
        await this.questionnaireCompetency
          .schema(this.requestParams.schema_name)
          .destroy({
            where: { questionnaire_id: id },
            transaction,
          });
        await this.questionnaireQuestion
          .schema(this.requestParams.schema_name)
          .destroy({
            where: { questionnaire_id: id },
            transaction,
          });

        await this.questionnaireCompetency
          .schema(this.requestParams.schema_name)
          .bulkCreate(competencies, {
            transaction,
          });
        await this.questionnaireQuestion
          .schema(this.requestParams.schema_name)
          .bulkCreate(questions, { transaction });
      }
      await transaction.commit();
      return "Questionnaire updated successfully";
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAllQuestionnaire() {
    return this.questionnaire
      .schema(this.requestParams.schema_name)
      .findAndCountAll({
        where: {
          ...getSearchObject(this.requestParams.query, [
            "title",
            "description",
          ]),
        },
        ...this.requestParams.pagination,
      });
  }

  async getSingleQuestionnaire(id: string) {
    const questionnaire = await this.questionnaire
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id },
        include: {
          model: Competency,
          required: false,
          through: { attributes: [] },
          include: [
            {
              model: Question,
              include: [
                {
                  model: QuestionnaireQuestion,
                  where: { questionnaire_id: id },
                  attributes: ["id"],
                },
                {
                  model: QuestionResponse,
                },
              ],
            },
          ],
        },
      });

    if (!questionnaire) throw new NotFoundException("Questionnaire not found");
    return questionnaire;
  }

  async getAllQuestions(questionnaire_id: string, competency_id: string) {
    return this.question.schema(this.requestParams.schema_name).findAll({
      where: { competency_id },
      attributes: commonAttrubutesToExclude,
      include: [
        {
          model: QuestionnaireQuestion,
          where: { questionnaire_id },
          attributes: [],
        },
      ],
    });
  }

  async deleteQuestionnaire(id: string) {
    const questionnaire = await this.questionnaire
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          id,
        },
      });

    if (!questionnaire) throw new NotFoundException("Questionnaire not found");

    await questionnaire.destroy();

    return "Questionnaire deleted successfully";
  }
}
