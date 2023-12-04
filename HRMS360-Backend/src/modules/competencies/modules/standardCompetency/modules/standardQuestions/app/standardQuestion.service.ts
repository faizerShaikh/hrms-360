import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { unlink } from "fs";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { RequestParamsService } from "src/common/modules";
import { Competency } from "src/modules/competencies/models";
import {
  CreateQuestionDTO,
  UpdateQuestionDTO,
} from "src/modules/competencies/modules/questions/dtos";
import {
  Question,
  QuestionAreaAssessment,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { QuestionResponseOptions } from "src/modules/competencies/modules/questions/types";
import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";
import { Tenant, TenantHistory } from "src/modules/tenants/models";
import { StandardCompetency } from "../../../models";
import {
  StandardQuestion,
  StandardQuestionAreaAssessment,
  StandardQuestionResponse,
} from "../models";
import {
  TenantHistoryGroup,
  TenantHistoryTypes,
} from "src/modules/tenants/types";
import { validateQuestion } from "src/common/helpers/validateQuestion.helper";
import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { join } from "path";

const XLSX = require("xlsx");

@Injectable()
export class StandardQuestionService {
  constructor(
    @InjectModel(Competency)
    private readonly competency: typeof Competency,
    @InjectModel(Tenant)
    private readonly tenant: typeof Tenant,
    @InjectModel(Question)
    private readonly question: typeof Question,
    @InjectModel(QuestionResponse)
    private readonly questionResponse: typeof QuestionResponse,
    @InjectModel(QuestionAreaAssessment)
    private readonly questionAreaAssessment: typeof QuestionAreaAssessment,
    @InjectModel(StandardCompetency)
    private readonly standardCompetency: typeof StandardCompetency,
    @InjectModel(StandardQuestion)
    private readonly standardQuestion: typeof StandardQuestion,
    @InjectModel(StandardQuestionResponse)
    private readonly standardQuestionResponse: typeof StandardQuestionResponse,
    @InjectModel(StandardQuestionAreaAssessment)
    private readonly standardQuestionAreaAssessment: typeof StandardQuestionAreaAssessment,
    @InjectModel(AreaAssessment)
    private readonly areaAssessment: typeof AreaAssessment,
    private readonly requestParams: RequestParamsService,
    @InjectModel(TenantHistory) private tenantHistory: typeof TenantHistory,
    @InjectConnection() private readonly sequelize: Sequelize
  ) {}

  async createQuestion(body: CreateQuestionDTO) {
    const transaction = await this.sequelize.transaction();
    try {
      const tenants = await this.tenant
        .schema(DB_PUBLIC_SCHEMA)
        .findAll<Tenant>({
          where: {
            parent_tenant_id: this.requestParams.tenant.id,
          },
          paranoid: false,
        });
      const competency = await this.standardCompetency
        .schema(DB_PUBLIC_SCHEMA)
        .findOne({
          where: {
            id: body.competency_id,
          },
        });

      const isQuestionExist = await this.standardQuestion
        .schema(DB_PUBLIC_SCHEMA)
        .findOne({
          where: {
            text: body.text,
            competency_id: body.competency_id,
          },
        });

      if (isQuestionExist)
        throw new BadRequestException(
          "Same question in this competency already exists"
        );

      let question = await this.standardQuestion
        .schema(DB_PUBLIC_SCHEMA)
        .create({ ...body }, { transaction });

      let respObj = {};
      let responses = body.responses.map((item, index) => {
        if (body.response_type === QuestionResponseOptions.likert_scale) {
          if (respObj[item.score]) {
            throw new BadRequestException(
              `Found responses with same score (${item.score}), please recheck scoring`
            );
          }
          respObj[item.score] = true;
        }
        return {
          ...item,
          order: index,
          question_id: question.id,
        };
      });

      if (body.response_type === QuestionResponseOptions.likert_scale) {
        responses.push({
          type: QuestionResponseOptions.likert_scale,
          label: "Don't Know",
          score: 0,
          question_id: question.id,
          order: body.responses.length + 1,
        });
      }

      let area_assessments = body.area_assessments.map((item) => ({
        question_id: question.id,
        area_assessment_id: item,
      }));
      await this.standardQuestionResponse
        .schema(DB_PUBLIC_SCHEMA)
        .bulkCreate(responses, { transaction });
      await this.standardQuestionAreaAssessment
        .schema(DB_PUBLIC_SCHEMA)
        .bulkCreate(area_assessments, { transaction });

      for (const tenant of tenants) {
        await this.question
          .schema(tenant.schema_name)
          .create<Question>({ ...body, id: question.id }, { transaction });

        await this.questionResponse
          .schema(tenant.schema_name)
          .bulkCreate(responses, { transaction });
        await this.questionAreaAssessment
          .schema(tenant.schema_name)
          .bulkCreate(area_assessments, { transaction });
        await this.competency
          .schema(tenant.schema_name)
          .increment<Competency>("no_of_questions", {
            where: {
              id: body.competency_id,
            },
            transaction,
          });
      }

      await this.standardCompetency.schema(DB_PUBLIC_SCHEMA).update(
        {
          no_of_questions: competency.no_of_questions + 1,
        },
        {
          where: {
            id: body.competency_id,
          },
          transaction,
        }
      );

      await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).create(
        {
          type: TenantHistoryTypes.question,
          reference_id: question.id,
          tenant_id: this.requestParams.tenant.id,
          group: TenantHistoryGroup.question,
        },
        { transaction }
      );
      await transaction.commit();

      return question;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateQuestion(body: UpdateQuestionDTO, id: string) {
    const transaction = await this.sequelize.transaction();
    try {
      const isQuestionExist = await this.standardQuestion
        .schema(DB_PUBLIC_SCHEMA)
        .findOne({
          where: {
            text: body.text,
            competency_id: body.competency_id,
            id: {
              [Op.ne]: id,
            },
          },
        });

      if (isQuestionExist)
        throw new BadRequestException(
          "Same question in this competency already exists"
        );

      await this.standardQuestion.schema(DB_PUBLIC_SCHEMA).update(body, {
        where: {
          id,
        },
        transaction,
      });

      let responses = [];
      let area_assessments = [];

      if (body.responses) {
        let respObj = {};
        let responses = body.responses.map((item, index) => {
          if (body.response_type === QuestionResponseOptions.likert_scale) {
            if (respObj[item.score]) {
              throw new BadRequestException(
                `Found responses with same score (${item.score}), please recheck scoring`
              );
            }
            respObj[item.score] = true;
          }
          return {
            ...item,
            order: index,
            question_id: id,
          };
        });
        if (body.response_type === QuestionResponseOptions.likert_scale) {
          responses.push({
            type: QuestionResponseOptions.likert_scale,
            label: "Don't Know",
            score: 0,
            question_id: id,
            order: body.responses.length + 1,
          });
        }
        await this.standardQuestionResponse.schema(DB_PUBLIC_SCHEMA).destroy({
          where: {
            question_id: id,
          },
          transaction,
        });
        await this.standardQuestionResponse
          .schema(DB_PUBLIC_SCHEMA)
          .bulkCreate(responses, { transaction });
      }

      if (body.area_assessments) {
        area_assessments = body.area_assessments.map((item) => ({
          question_id: id,
          area_assessment_id: item,
        }));

        await this.standardQuestionAreaAssessment
          .schema(DB_PUBLIC_SCHEMA)
          .destroy({
            where: {
              question_id: id,
            },
            transaction,
          });

        await this.standardQuestionAreaAssessment
          .schema(DB_PUBLIC_SCHEMA)
          .bulkCreate(area_assessments, { transaction });
      }

      const tenants = await this.tenant
        .schema(DB_PUBLIC_SCHEMA)
        .findAll<Tenant>({
          where: {
            parent_tenant_id: this.requestParams.tenant.id,
          },
          paranoid: false,
        });

      for (const tenant of tenants) {
        await this.question
          .schema(tenant.schema_name)
          .update<Question>({ ...body }, { where: { id }, transaction });

        if (responses.length) {
          await this.questionResponse.schema(tenant.schema_name).destroy({
            where: {
              question_id: id,
            },
            transaction,
          });
          await this.questionResponse
            .schema(tenant.schema_name)
            .bulkCreate(responses, { transaction });
        }

        if (area_assessments.length) {
          await this.questionAreaAssessment.schema(tenant.schema_name).destroy({
            where: {
              question_id: id,
            },
            transaction,
          });

          await this.questionAreaAssessment
            .schema(tenant.schema_name)
            .bulkCreate(area_assessments, { transaction });
        }
      }

      await transaction.commit();
      return "Question updated successfully";
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteQuestion(id: string) {
    const transaction = await this.sequelize.transaction();
    try {
      const question = await this.standardQuestion
        .schema(DB_PUBLIC_SCHEMA)
        .findOne({
          where: { id },
        });

      if (!question) throw new NotFoundException("Question not found");

      await question.destroy({ transaction });
      await this.standardCompetency
        .schema(DB_PUBLIC_SCHEMA)
        .decrement("no_of_questions", {
          where: {
            id: question.competency_id,
          },
          transaction,
        });
      const tenants = await this.tenant
        .schema(DB_PUBLIC_SCHEMA)
        .findAll<Tenant>({
          where: {
            parent_tenant_id: this.requestParams.tenant.id,
          },
          paranoid: false,
        });

      for (const tenant of tenants) {
        await this.question
          .schema(tenant.schema_name)
          .destroy({ where: { id }, transaction });

        await this.competency
          .schema(tenant.schema_name)
          .decrement("no_of_questions", {
            where: {
              id: question.competency_id,
            },
            transaction,
          });
      }

      await this.tenantHistory
        .schema(DB_PUBLIC_SCHEMA)
        .destroy({ where: { reference_id: id }, transaction });
      await transaction.commit();
      return "Question deleted successfully";
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async importQuestionsNew(file: Express.Multer.File, competency_id: string) {
    const transaction = await this.sequelize.transaction();
    try {
      const workbook = XLSX.readFile(file.path);
      if (!workbook.SheetNames.includes("Questions"))
        throw new NotFoundException(
          "Sheet not found, please check for sheet with name as 'Questions' or download the sample file again"
        );

      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets["Questions"]);

      const competency = await this.standardCompetency
        .schema(DB_PUBLIC_SCHEMA)
        .findOne({
          where: {
            id: competency_id,
          },
        });

      let data = [];
      let responses = [];

      let areaAssessmentsIncluded = {};
      let areaAssessments = [];
      let questionAreaAssessments = [];
      let tenantHistory = [];

      for (let index = 0; index < sheetData.length; index++) {
        const row = validateQuestion(sheetData[index]);

        const [obj, created] = await this.standardQuestion
          .schema(DB_PUBLIC_SCHEMA)
          .findOrBuild({
            where: {
              text: row.text,
              competency_id: competency.id,
            },
            defaults: {
              ...row,
              competency_id: competency.id,
            },
          });

        if (!created)
          throw new BadRequestException(
            "Same question in this competency already exists"
          );

        tenantHistory.push({
          type: TenantHistoryTypes.question,
          reference_id: `${obj.id}`,
          tenant_id: this.requestParams.tenant.id,
        });

        for (let a = 0; a < row.areaAssessments.length; a++) {
          const areaAssessment = row.areaAssessments[a];
          if (areaAssessment) {
            const [areaAssessmentFromDB] = await this.areaAssessment
              .schema(DB_PUBLIC_SCHEMA)
              .findOrBuild({
                where: {
                  name: areaAssessment.trim(),
                  tenant_id: this.requestParams.tenant.id,
                },
                defaults: {
                  name: areaAssessment.trim(),
                  tenant_id: this.requestParams.tenant.id,
                },
                raw: true,
                plain: true,
              });

            if (!areaAssessmentsIncluded[areaAssessment.trim()]) {
              let x = areaAssessmentFromDB["dataValues"]
                ? areaAssessmentFromDB["dataValues"]
                : areaAssessmentFromDB;
              areaAssessments.push(x);
              areaAssessmentsIncluded[areaAssessment.trim()] = x.id;
            }

            questionAreaAssessments.push({
              name: areaAssessment.trim(),
              area_assessment_id:
                areaAssessmentsIncluded[areaAssessment.trim()],
              question_id: `${obj.id}`,
            });
          }
        }

        for (const resp of row.responses) {
          responses.push({ ...resp, question_id: `${obj.id}` });
        }

        if (row.response_type === QuestionResponseOptions.likert_scale) {
          responses.push({
            type: QuestionResponseOptions.likert_scale,
            label: "Don't Know",
            score: 0,
            question_id: obj.id,
            order: row.responses.length + 1,
          });
        }

        data.push(obj);
      }

      await this.standardQuestion.schema(DB_PUBLIC_SCHEMA).bulkCreate(
        data.map((item) => item.dataValues),
        { transaction }
      );
      await this.standardQuestionResponse
        .schema(DB_PUBLIC_SCHEMA)
        .bulkCreate(responses, { transaction });
      await this.areaAssessment
        .schema(DB_PUBLIC_SCHEMA)
        .bulkCreate(areaAssessments, {
          updateOnDuplicate: ["name"],
          transaction,
        });

      await this.standardQuestionAreaAssessment
        .schema(DB_PUBLIC_SCHEMA)
        .bulkCreate(questionAreaAssessments, {
          transaction,
        });

      await this.tenantHistory
        .schema(DB_PUBLIC_SCHEMA)
        .bulkCreate(tenantHistory, { transaction });
      await competency.update(
        {
          no_of_questions: data.length + competency.no_of_questions,
        },
        {
          transaction,
        }
      );

      const tenants = await this.tenant
        .schema(DB_PUBLIC_SCHEMA)
        .findAll<Tenant>({
          where: {
            parent_tenant_id: this.requestParams.tenant.id,
          },
          paranoid: false,
        });

      for (const tenant of tenants) {
        await this.question.schema(tenant.schema_name).bulkCreate(
          data.map((item) => item.dataValues),
          { transaction }
        );
        await this.questionResponse
          .schema(tenant.schema_name)
          .bulkCreate(responses, { transaction });
        await this.areaAssessment.schema(tenant.schema_name).bulkCreate(
          areaAssessments.map((item) =>
            item.dataValues ? item.dataValues : item
          ),
          { updateOnDuplicate: ["name"], transaction }
        );
        await this.questionAreaAssessment
          .schema(tenant.schema_name)
          .bulkCreate(questionAreaAssessments, {
            transaction,
            updateOnDuplicate: ["question_id", "area_assessment_id"],
          });

        await this.competency
          .schema(tenant.schema_name)
          .increment("no_of_questions", {
            by: data.length,
            where: {
              id: competency_id,
            },
            transaction,
          });
      }

      unlink(join(__dirname, "../../../../../../../../", file.path), () => {
        console.log("done...");
      });
      await transaction.commit();
      return;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
