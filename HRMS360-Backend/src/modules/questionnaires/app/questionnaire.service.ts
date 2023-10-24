import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { fn, literal } from "sequelize";
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
    @InjectModel(Competency)
    private readonly competency: typeof Competency,
    @InjectModel(QuestionnaireQuestion)
    private readonly questionnaireQuestion: typeof QuestionnaireQuestion,
    private readonly requestParams: RequestParamsService
  ) {}

  async createQuestionnaire(body: CreateQuestionnaireDTO) {
    let no_of_questions = 0;

    const questionnaire = await this.questionnaire
      .schema(this.requestParams.schema_name)
      .create<Questionnaire>(
        {
          ...body,
          no_of_questions: 0,
        },
        { transaction: this.requestParams.transaction }
      );

    let questions = [];

    const competencies = body.competencies.map((item, index) => {
      for (const [index2, question] of item.questionIds.entries()) {
        questions.push({
          questionnaire_id: questionnaire.id,
          question_id: question,
          order: index2 + 1,
        });
      }
      no_of_questions += item.questionIds.length;
      return {
        questionnaire_id: questionnaire.id,
        order: index + 1,
        competency_id: item.id,
        no_of_questions: item.questionIds.length,
      };
    });

    await questionnaire.update(
      { no_of_questions },
      { transaction: this.requestParams.transaction }
    );

    await this.questionnaireCompetency
      .schema(this.requestParams.schema_name)
      .bulkCreate(competencies, {
        transaction: this.requestParams.transaction,
      });
    await this.questionnaireQuestion
      .schema(this.requestParams.schema_name)
      .bulkCreate(questions, {
        transaction: this.requestParams.transaction,
      });

    return questionnaire;
  }

  async updateQuestionnaire(body: UpdateQuestionnaireDTO, id: string) {
    const questionnaire = await this.questionnaire
      .schema(this.requestParams.schema_name)
      .findOne<Questionnaire>({
        where: {
          id,
        },
      });

    if (!questionnaire) throw new NotFoundException("Questionnaire not found");

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
      { transaction: this.requestParams.transaction }
    );

    if (competencies?.length) {
      await this.questionnaireCompetency
        .schema(this.requestParams.schema_name)
        .destroy({
          where: { questionnaire_id: id },
          transaction: this.requestParams.transaction,
        });
      await this.questionnaireQuestion
        .schema(this.requestParams.schema_name)
        .destroy({
          where: { questionnaire_id: id },
          transaction: this.requestParams.transaction,
        });

      await this.questionnaireCompetency
        .schema(this.requestParams.schema_name)
        .bulkCreate(competencies, {
          transaction: this.requestParams.transaction,
        });
      await this.questionnaireQuestion
        .schema(this.requestParams.schema_name)
        .bulkCreate(questions, {
          transaction: this.requestParams.transaction,
        });
    }
    return "Questionnaire updated successfully";
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
        distinct: true,
        include: [{ model: QuestionnaireQuestion }],
        ...this.requestParams.pagination,
      });
  }

  async getSingleQuestionnaire(id: string) {
    const questionnaire = await this.questionnaire
      .schema(this.requestParams.schema_name)
      .unscoped()
      .findOne({
        order: [
          [
            {
              model: Competency,
              as: "competencies",
            },
            {
              model: QuestionnaireCompetency,
              as: "questionnaireCompetencies",
            },
            "order",
            "ASC",
          ],
        ],
        where: { id },
        include: [
          {
            model: Competency,
            required: false,
            through: { attributes: ["order"] },
            include: [
              {
                model: Question,
                include: [
                  {
                    model: QuestionnaireQuestion,
                    where: { questionnaire_id: id },
                    attributes: ["id", "order"],
                  },
                  {
                    model: QuestionResponse,
                  },
                ],
              },
              {
                model: QuestionnaireCompetency,
              },
            ],
          },
        ],
      });

    if (!questionnaire) throw new NotFoundException("Questionnaire not found");
    return questionnaire;
  }

  async getSingleQuestionnaireCompetencies(id: string) {
    const questionnaire = await this.competency
      .schema(this.requestParams.schema_name)
      .unscoped()
      .findAll({
        order: [
          [
            {
              model: QuestionnaireCompetency,
              as: "questionnaireCompetencies",
            },
            "order",
            "ASC",
          ],
        ],
        where: {
          ...getSearchObject(this.requestParams.query, [
            "title",
            "description",
            "no_of_questions",
            "createdAt",
            "type",
          ]),
        },
        include: [
          {
            model: QuestionnaireCompetency,
            where: {
              questionnaire_id: id,
            },
          },
          {
            model: Question.unscoped(),
            attributes: ["id"],
            include: [
              {
                model: QuestionnaireQuestion,
                where: { questionnaire_id: id },
                attributes: [],
              },
            ],
          },
        ],
      });

    if (!questionnaire) throw new NotFoundException("Questionnaire not found");
    return questionnaire;
  }

  async getSingleQuestionnaireQuestion(
    questionnaire_id: string,
    competency_id: string
  ) {
    const questionnaire = await this.question
      .schema(this.requestParams.schema_name)
      .unscoped()
      .findAll({
        order: [
          [
            {
              model: QuestionnaireQuestion,
              as: "questionnaireQuestion",
            },
            "order",
            "ASC",
          ],
        ],
        where: {
          competency_id: competency_id,
          ...getSearchObject(this.requestParams.query, [
            "response_type",
            "text",
          ]),
        },
        include: [
          {
            model: QuestionnaireQuestion,
            where: {
              questionnaire_id: questionnaire_id,
            },
          },
        ],
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
    await this.questionnaire.schema(this.requestParams.schema_name).destroy({
      where: {
        id,
      },
    });
    // await questionnaire.destroy();

    return "Questionnaire deleted successfully";
  }

  async manageOrder<T extends {} = any>(
    dto: any,
    questionnaire_id: string
  ): Promise<T | any> {


    const questionnaire = await this.questionnaireCompetency
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          questionnaire_id,
          competency_id: dto?.id,
        },
      });

    if (dto?.orderType === "promote") {
      await this.questionnaireCompetency
        .schema(this.requestParams?.schema_name)
        .update(
          { order: questionnaire?.order },
          { where: { order: questionnaire?.order - 1 } }
        );

      return await questionnaire.update({ order: questionnaire?.order - 1 });
    }

    if (dto?.orderType === "demote") {
      await this.questionnaireCompetency
        .schema(this.requestParams?.schema_name)
        .update(
          { order: questionnaire?.order },
          { where: { order: questionnaire?.order + 1 } }
        );

      return await questionnaire.update({ order: questionnaire?.order + 1 });
    }
  }

  async manageOrderQuestions<T extends {} = any>(
    dto: any,
    questionnaire_id: string
  ): Promise<T | any> {
    const questionnaire = await this.questionnaireQuestion
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          questionnaire_id,
          question_id: dto?.id,
        },
        include: {
          model: Question,
        },
      });
  

    if (dto?.orderType === "promote") {
      const questionnaireQuestions = await this.questionnaireQuestion
        .schema(this.requestParams.schema_name)
        .findOne({
          where: {
            order: questionnaire?.order - 1,
          },
          include: {
            required: true,
            model: Question,
            where: {
              competency_id: questionnaire.question.competency_id,
            },
          },
        });

      // await this.questionnaireQuestion
      //   .schema(this.requestParams?.schema_name)
      //   .update(
      //     { order: questionnaire?.order },
      //     {
      //       where: {
      //         order: questionnaire?.order - 1,
      //       },
      //     }
      //   );
      await questionnaireQuestions.update({ order: questionnaire?.order });
      return await questionnaire.update({ order: questionnaire?.order - 1 });
    }

    if (dto?.orderType === "demote") {
      const questionnaireQuestions = await this.questionnaireQuestion
        .schema(this.requestParams.schema_name)
        .findOne({
          where: {
            order: questionnaire?.order + 1,
          },
          include: {
            required: true,
            model: Question,
            where: {
              competency_id: questionnaire.question.competency_id,
            },
          },
        });

      // await this.questionnaireQuestion
      //   .schema(this.requestParams?.schema_name)
      //   .update(
      //     { order: questionnaire?.order },
      //     {
      //       where: {
      //         order: questionnaire?.order + 1,
      //       },

      //     }
      //   );
      await questionnaireQuestions.update({ order: questionnaire?.order });

      return await questionnaire.update({ order: questionnaire?.order + 1 });
    }
  }
}
