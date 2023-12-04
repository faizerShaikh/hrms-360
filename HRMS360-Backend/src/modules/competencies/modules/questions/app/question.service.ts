import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { unlink } from "fs";
import { join } from "path";
import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { validateQuestion } from "src/common/helpers/validateQuestion.helper";
import { RequestParamsService } from "src/common/modules";
import { Competency } from "src/modules/competencies/models";
import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";
import { TenantHistory } from "src/modules/tenants/models";
import {
  TenantHistoryGroup,
  TenantHistoryTypes,
} from "src/modules/tenants/types";
import { CreateQuestionDTO, UpdateQuestionDTO } from "../dtos";
import { Question, QuestionAreaAssessment, QuestionResponse } from "../models";
import { QuestionResponseOptions } from "../types";
const ExcelJS = require("exceljs");
const XLSX = require("xlsx");

@Injectable()
export class QuestionService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(Competency)
    private readonly competency: typeof Competency,
    @InjectModel(Question)
    private readonly question: typeof Question,
    @InjectModel(QuestionResponse)
    private readonly questionResponse: typeof QuestionResponse,
    @InjectModel(QuestionAreaAssessment)
    private readonly questionAreaAssessment: typeof QuestionAreaAssessment,
    @InjectModel(AreaAssessment)
    private readonly areaAssessment: typeof AreaAssessment,
    private readonly requestParams: RequestParamsService,
    @InjectModel(TenantHistory)
    private tenantHistory: typeof TenantHistory
  ) {}

  async createQuestion(body: CreateQuestionDTO) {
    const transaction = await this.sequelize.transaction();
    try {
      const isQuestionExist = await this.question
        .schema(this.requestParams.schema_name)
        .findOne({
          where: {
            text: body.text,
            is_copy: false,
            competency_id: body.competency_id,
          },
        });

      if (isQuestionExist)
        throw new BadRequestException(
          "Same question in this competency already exists"
        );

      const competency = await this.competency
        .schema(this.requestParams.schema_name)
        .findOne<Competency>({
          where: {
            id: body.competency_id,
          },
        });

      const question = this.question
        .schema(this.requestParams.schema_name)
        .build<Question>({ ...body });

      let respObj = {};
      let scores = [];
      let responses = body.responses.map((item, index) => {
        if (body.response_type === QuestionResponseOptions.likert_scale) {
          if (respObj[item.score]) {
            throw new BadRequestException(
              `Found responses with same score (${item.score}), please recheck scoring`
            );
          }
          scores.push(item.score);
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

      question.max_score =
        body.response_type === QuestionResponseOptions.likert_scale
          ? Math.max(...scores)
          : 0;

      let area_assessments = body.area_assessments.map((item) => ({
        question_id: question.id,
        area_assessment_id: item,
      }));

      await question.save({ transaction });
      await this.questionResponse
        .schema(this.requestParams.schema_name)
        .bulkCreate(responses, { transaction });
      await this.questionAreaAssessment
        .schema(this.requestParams.schema_name)
        .bulkCreate(area_assessments, {
          transaction,
        });

      await competency.increment("no_of_questions");

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
      return "Question created successfully";
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateQuestion(body: UpdateQuestionDTO, id: string) {
    const transaction = await this.sequelize.transaction();
    try {
      const isQuestionExist = await this.question
        .schema(this.requestParams.schema_name)
        .findOne({
          where: {
            text: body.text,
            is_copy: false,
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

      const question = await this.question
        .schema(this.requestParams.schema_name)
        .findOne<Question>({ where: { id } });

      if (!question) throw new NotFoundException("Question not found");

      question.update(body, { transaction });

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
        await this.questionResponse
          .schema(this.requestParams.schema_name)
          .destroy({
            where: {
              question_id: question.id,
            },
            transaction,
          });
        await this.questionResponse
          .schema(this.requestParams.schema_name)
          .bulkCreate(responses, { transaction });
      }

      if (body.area_assessments) {
        let area_assessments = body.area_assessments.map((item) => ({
          question_id: question.id,
          area_assessment_id: item,
        }));

        await this.questionAreaAssessment
          .schema(this.requestParams.schema_name)
          .destroy({
            where: {
              question_id: question.id,
            },
            transaction,
          });

        await this.questionAreaAssessment
          .schema(this.requestParams.schema_name)
          .bulkCreate(area_assessments, {
            transaction,
          });
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
      const question = await this.question
        .schema(this.requestParams.schema_name)
        .findOne({
          where: { id },
        });

      if (!question) throw new NotFoundException("Question not found");

      await question.destroy({ transaction });

      await this.competency
        .schema(this.requestParams.schema_name)
        .decrement("no_of_questions", {
          where: {
            id: question.competency_id,
          },
          transaction,
        });

      await this.tenantHistory
        .schema(DB_PUBLIC_SCHEMA)
        .destroy({ where: { reference_id: id }, transaction });
      (await transaction).commit();
      return "Question deleted successfully";
    } catch (error) {
      (await transaction).rollback();
      throw error;
    }
  }

  async getSampleQuestionFile() {
    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("Questions", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = [
      { header: "Question", key: "Question", width: 50 },
      { header: "Type", key: "Type", width: 20 },
      { header: "Area of Assessment", key: "Area of Assessment", width: 30 },
      { header: "1", key: "1", width: 20 },
      { header: "2", key: "2", width: 20 },
      { header: "3", key: "3", width: 20 },
      { header: "4", key: "4", width: 20 },
      { header: "5", key: "5", width: 20 },
    ];

    // Question Type Column
    sheet.dataValidations.add("B2:B9999", {
      type: "list",
      allowBlank: false,
      formulae: ['"Likert Scale,Yes/No,Multiple Choice,Single Choice,Text"'],
      showErrorMessage: true,
      errorStyle: "error",
      error: "Enter the correct Type",
    });

    sheet.getCell("C1").note =
      "Add Area Assessments seprated by comma separated.\nFor Eg: Area Assessment 1, Area Assessment 2, Area Assessment 3,..., etc";

    await workbook.xlsx.writeFile(
      "./src/public/media/excels/Sample-Question-Excel.xlsx"
    );
    return "/media/excels/Sample-Question-Excel.xlsx";
  }

  async importQuestions(file: Express.Multer.File, competency_id: string) {
    const workbook = XLSX.readFile(file.path);
    if (!workbook.SheetNames.includes("Questions"))
      throw new NotFoundException(
        "Sheet not found, please check for sheet with name as 'Questions' or download the sample file again"
      );

    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets["Questions"]);

    const competency = await this.competency
      .schema(this.requestParams.schema_name)
      .findOne<Competency>({
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

    const transaction = await this.sequelize.transaction();
    try {
      for (let index = 0; index < sheetData.length; index++) {
        const row = validateQuestion(sheetData[index]);

        const [obj, created] = await this.question
          .schema(this.requestParams.schema_name)
          .findOrBuild({
            where: {
              text: row.text,
              is_copy: false,
              competency_id: competency.id,
            },
            defaults: {
              ...row,
              competency_id: competency.id,
            },
            transaction,
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
              .schema(this.requestParams.schema_name)
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
                transaction,
              });

            if (!areaAssessmentsIncluded[areaAssessment.trim()]) {
              let x = areaAssessmentFromDB["dataValues"]
                ? areaAssessmentFromDB["dataValues"]
                : areaAssessmentFromDB;
              areaAssessments.push(x);
              areaAssessmentsIncluded[areaAssessment.trim()] = x.id;
            }

            questionAreaAssessments.push({
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

      await this.question.schema(this.requestParams.schema_name).bulkCreate(
        data.map((item) => item.dataValues),
        { transaction }
      );
      await this.questionResponse
        .schema(this.requestParams.schema_name)
        .bulkCreate(responses, { transaction });
      await this.areaAssessment
        .schema(this.requestParams.schema_name)
        .bulkCreate(areaAssessments, {
          updateOnDuplicate: ["name"],
          transaction,
        });
      await this.questionAreaAssessment
        .schema(this.requestParams.schema_name)
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
        { transaction }
      );

      unlink(join(__dirname, "../../../../../../", file.path), (err) => {
        console.log(err, file.path);
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
