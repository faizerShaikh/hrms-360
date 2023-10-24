import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { unlink } from "fs";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { RequestParamsService } from "src/common/modules";
import { Rater } from "src/modules/settings/modules/rater/models";
import { User } from "src/modules/users/models";
import {
  ExcelSurveyDTO,
  ExcelSurveyRespondentsDTO,
} from "../dtos/excelSurveyRespondents.dto";
import { col, fn, literal, Op, Optional, Sequelize } from "sequelize";
import {
  // CompetencyComment,
  DraftSurvey,
  Survey,
  SurveyDescription,
  SurveyExternalRespondant,
  SurveyRespondant,
  SurveyResponse,
} from "../models";
import {
  Status,
  SurveyDescriptionStatus,
  SurveyRespondantStatus,
  SurveyStatus,
} from "../type/index";
import { SurveyService } from "./survey.service";
import { CreateSurveyDTO, NBOUpdateSurveyDTO } from "../dtos";
import {
  SubmitSingleSurveyDTO,
  SubmitSurveyDTO,
  SubmitSurveySingleRateeDTO,
  SurveyRespondentDTO,
} from "../dtos/submitSurvey.dto";
import { JwtService } from "@nestjs/jwt";
import { QuestionResponseOptions } from "src/modules/competencies/modules/questions/types";
import { MailsService } from "src/common/modules/mails";
import { ConfigService } from "@nestjs/config";
import {
  defaultAttachments,
  defaultAttachmentsNBOL,
  defaultContext,
} from "src/common/modules/mails/constants";
import * as moment from "moment";
import {
  TenantHistoryGroup,
  TenantHistoryTypes,
} from "src/modules/tenants/types";
import { Tenant, TenantHistory, TenantUser } from "src/modules/tenants/models";
import {
  Questionnaire,
  QuestionnaireCompetency,
  QuestionnaireQuestion,
} from "src/modules/questionnaires/models";
import {
  Question,
  QuestionAreaAssessment,
  QuestionResponse,
} from "src/modules/competencies/modules/questions/models";
import { Department } from "src/modules/settings/modules/department/models";
import { Designation } from "src/modules/settings/modules/designation/models";
import { GetSurveyService } from "./getSurvey.service";
import { Competency } from "src/modules/competencies/models";
import { AreaAssessment } from "src/modules/settings/modules/areaAssessment/models";
import { ReportsService } from "src/modules/reports/reports.service";
import { randomUUID } from "crypto";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { SUREVY_QUEUE, SURVEY_AFTER_SUBMITION_PROCESS } from "../constants";
import { findLastMatch } from "pdf-lib";
import {
  SurveyRespondentAddDTO,
  SurveyRespondentupdateDTO,
} from "../dtos/surveyRespondentUpdate.dto";
import { CommentResponse } from "../models/commentResponse.model";
const XLSX = require("xlsx");

const ExcelJS = require("exceljs");

@Injectable()
export class NbolSurveyService {
  constructor(
    @InjectModel(Rater)
    private readonly rater: typeof Rater,
    @InjectModel(User) private readonly user: typeof User,
    @InjectModel(Department) private readonly department: typeof Department,
    @InjectModel(Designation) private readonly designation: typeof Designation,
    @InjectModel(Survey) private readonly survey: typeof Survey,
    @InjectModel(DraftSurvey) private readonly draftSurvey: typeof DraftSurvey,
    @InjectModel(Competency) private readonly competency: typeof Competency,
    @InjectModel(QuestionnaireCompetency)
    private readonly questionnaireCompetency: typeof QuestionnaireCompetency,
    @InjectModel(QuestionResponse)
    private readonly questionResponse: typeof QuestionResponse,
    @InjectModel(QuestionAreaAssessment)
    private readonly questionAreaAssessment: typeof QuestionAreaAssessment,
    @InjectModel(QuestionnaireQuestion)
    private readonly questionnaireQuestion: typeof QuestionnaireQuestion,
    @InjectModel(Questionnaire)
    private readonly questionnaire: typeof Questionnaire,
    private surveyService: SurveyService,
    @InjectModel(SurveyResponse)
    private readonly surveyResponse: typeof SurveyResponse,
    @InjectModel(Question)
    private readonly question: typeof Question,
    @InjectModel(SurveyDescription)
    private readonly surveyDescription: typeof SurveyDescription,
    // @InjectModel(CompetencyComment)
    // private readonly competencyComment: typeof CompetencyComment,
    @InjectModel(CommentResponse)
    private readonly commentResponse: typeof CommentResponse,
    @InjectModel(SurveyRespondant)
    private readonly surveyRespondant: typeof SurveyRespondant,
    @InjectModel(SurveyExternalRespondant)
    private readonly surveyExternalRespondant: typeof SurveyExternalRespondant,
    @InjectModel(TenantHistory)
    private readonly tenantHistory: typeof TenantHistory,
    @InjectModel(Tenant) private readonly tenant: typeof Tenant,
    @InjectModel(TenantUser)
    private readonly tenantUser: typeof TenantUser,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly mailsService: MailsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly requestParams: RequestParamsService,
    private readonly getSurveyService: GetSurveyService,
    private readonly reportsService: ReportsService,
    @InjectQueue(SUREVY_QUEUE) private readonly surveyQueue: Queue
  ) {}

  async sampleExcel(createExcel = true) {
    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("Sample NbolSurvey Excel", {
      views: [{ state: "frozen", ySplit: 1 }],
      pageSetup: {
        horizontalCentered: true,
        verticalCentered: true,
      },
    });

    const raters = await this.rater
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          survey_description_id: null,
          name: {
            [Op.ne]: "Self",
          },
        },
      });

    sheet.mergeCells("A1:E1");
    sheet.getCell("A1").value = "Ratee";
    sheet.getCell("A1").alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    sheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFF00" },
      bgColor: { argb: "FF0000FF" },
    };

    let obj = [];
    let keyNames = [
      "ratee_name",
      "ratee_email",
      "ratee_contact",
      "ratee_designation",
      "ratee_department",
    ];
    let styles = ["FFCCFFCC", "FFFF6600", "FF00FF00", "FFFFFFFF", "FFFF0000"];
    let rowNames = [
      "Ratee Name",
      "Ratee Email",
      "Ratee Contact",
      "Ratee Designation",
      "Ratee Department",
    ];
    let startCellNumber = 6;
    let lastCellNumber = 6;

    for (const [index, rater] of raters.entries()) {
      startCellNumber = lastCellNumber;
      lastCellNumber =
        lastCellNumber + rater.no_of_raters * (rater.is_external ? 2 : 3);

      let startCell = sheet.getRow(1).getCell(startCellNumber);
      let lastCell = sheet.getRow(1).getCell(lastCellNumber - 1);

      sheet.mergeCells(`${startCell._address}:${lastCell._address}`);
      sheet.getCell(startCell._address).value = rater.category_name;
      sheet.getCell(startCell._address).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      sheet.getCell(startCell._address).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: styles[index] },
      };

      for (let i = 1; i <= rater.no_of_raters; i++) {
        rowNames.push(
          `${rater.category_name} ${i} name`,
          `${rater.category_name} ${i} email `
        );

        obj.push(
          {
            key: `${rater.name} ${i} name`.replace(/ /g, "_"),
            width: 30,
          },
          {
            key: `${rater.name} ${i} email`.replace(/ /g, "_"),
            width: 30,
          }
        );

        keyNames.push(
          `name=${rater.name}&index=${i}&field=name`.replace(/ /g, "_"),
          `name=${rater.name}&index=${i}&field=email`.replace(/ /g, "_")
        );

        if (!rater.is_external) {
          rowNames.push(`${rater.category_name} ${i} designation`);
          obj.push({
            key: `${rater.name} ${i} designation`.replace(/ /g, "_"),
            width: 30,
          });
          keyNames.push(
            `name=${rater.name}&index=${i}&field=designation`.replace(/ /g, "_")
          );
        }
      }
    }

    sheet.getRow(2).values = [...rowNames];

    sheet.columns = [
      { key: "ratee_name", width: 30 },
      { key: "ratee_email", width: 30 },
      { key: "ratee_contact", width: 30 },
      { key: "ratee_designation", width: 30 },
      { key: "ratee_department", width: 30 },
      ...obj,
    ];
    if (createExcel === true) {
      await workbook.xlsx.writeFile(
        "./src/public/media/excels/Sample-NbolSurvey-Excel.xlsx"
      );
    }
    return {
      message:
        createExcel === true
          ? "/media/excels/Sample-NbolSurvey-Excel.xlsx"
          : "No Message",
      format: keyNames,
    };
  }

  async sampleExcelNew(createExcel = true, id) {
    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("Sample NbolSurvey Excel", {
      views: [{ state: "frozen", ySplit: 1 }],
      pageSetup: {
        horizontalCentered: true,
        verticalCentered: true,
      },
    });

    const raters = await this.rater
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          survey_description_id: null,
        },
      });

    sheet.getColumn("A").alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    // sheet.getRow(1).fill = {
    //   type: "pattern",
    //   pattern: "solid",
    //   fgColor: { argb: "FFFFFF00" },
    //   bgColor: { argb: "FF00FF00" },
    // };

    let keyNames = [
      "ratee_id",
      "ratee_name",
      "ratee_email",
      "ratee_contact",
      "ratee_designation",
      "ratee_department",
    ];
    let rowNames = [
      "Control",
      "ID",
      "Rater Full Name",
      "Rater Email Address",
      "Rater Contact",
      "Ratee Designation",
      "Ratee Department",
      "Relationship To Ratee",
    ];
    var rowNumber = 1;
    let selfindex;
    let itemToMove = {
      id: "0f4b7b47-2c3b-4afd-b88a-30e850b6c094",
      category_name: "Self",
      name: "Self",
      short_name: "SLF",
      no_of_raters: 1,
      is_required: true,
      can_be_deleted: false,
      is_external: false,
      survey_description_id: null,
      createdAt: "2023-03-30T11:28:44.529Z",
      updatedAt: "2023-03-30T11:28:44.529Z",
      deletedAt: null,
    };
    raters.forEach((item, index) => {
      if (item.category_name === "Self") {
        selfindex = index;
      }
    }); // get the index of the item to move
    if (selfindex !== -1) {
      // check if the item exists in the array
      const spliced = raters.splice(selfindex, 1); // remove the item from its current position
      raters.unshift(spliced[0]); // add the item to the beginning of the array
    }

    for (let j = 1; j <= 250; j++) {
      for (const [index, rater] of raters.entries()) {
        for (let i = 1; i <= rater.no_of_raters; i++) {
          if (rater.category_name === "Self") {
            sheet.getRow(rowNumber + 1).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFFF00" },
              bgColor: { argb: "FF00FF00" },
            };
          }
          // Get the column
          const column = sheet.getColumn("H");
          const controlColumn = sheet.getColumn("A");

          // Add a value to a row
          const row = sheet.getRow(rowNumber + 1);
          const controlRow = sheet.getRow(rowNumber + 1);
          row.getCell(column.number).value = rater.category_name;
          controlRow.getCell(controlColumn.number).value = rowNumber;
          rowNumber++;
        }
      }
    }
    const column = sheet.getColumn(8); // get the second column
    column.protection = { locked: true };

    // sheet.getRow(1).fill = {
    //   type: "pattern",
    //   pattern: "solid",
    //   // fgColor: { argb: "#c4d79b" },
    //   // bgColor: { argb: "#c4d79b" },
    // };
    sheet.getRow(1).values = [...rowNames];

    sheet.columns = [
      { key: "control", width: 30 },
      { key: "ratee_id", width: 30 },
      { key: "ratee_name", width: 30 },
      { key: "ratee_email", width: 30 },
      { key: "ratee_contact", width: 30 },
      { key: "ratee_designation", width: 30 },
      { key: "ratee_department", width: 30 },
      { key: "relationship_to_ratee", width: 30 },
    ];
    if (createExcel === true) {
      await workbook.xlsx.writeFile(
        "./src/public/media/excels/Sample-NbolSurvey-Excel-new.xlsx"
      );
    }
    return {
      message:
        createExcel === true
          ? "/media/excels/Sample-NbolSurvey-Excel-new.xlsx"
          : "No Message",
      format: keyNames,
      data: raters,
      surveyDescription_id: id ? id : null,
    };
  }

  async CreateExcelSurvey(file: any, keysArr: string) {
    keysArr = await JSON.parse(keysArr);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(`${file.path}`);
    const sheet = workbook.getWorksheet("Sample NbolSurvey Excel");

    if (!sheet) {
      unlink(file.path, (err) => {
        console.log(err, file.path);
        console.log("done...");
      });
      throw new NotFoundException(
        "Sheet not Found. Please use downloaded sample excel file"
      );
    }

    const rs = sheet.getColumn(1);

    let rowsCount = 0;

    rs.eachCell(() => {
      rowsCount++;
    });

    let surveyDataArr = [];
    let rows = sheet.getRows(3, rowsCount + 1);
    for (let row of rows) {
      let obj = {};
      row.eachCell({ includeEmpty: true }, (cell: any, cn: any) => {
        cn = cn - 1;

        if (this.validateEmail(cell?.value?.toString())) {
          cell.value = cell.value.toLowerCase();
        }
        typeof cell.value === "object"
          ? cell.value === null
            ? (obj[keysArr[cn]] = "")
            : (obj[keysArr[cn]] = cell?.value?.text?.toLowerCase()) ||
              cell?.value?.result?.toLowerCase()
          : cell.value === null
          ? (obj[keysArr[cn]] = "")
          : (obj[keysArr[cn]] = cell.value || cell.value.result);
      });
      Object.keys(obj).length != 0 ? surveyDataArr.push(obj) : obj;
    }

    surveyDataArr.forEach((e, index) => {
      let obj = {};
      if (Object.keys(e).length < keysArr.length) {
        for (const temp of keysArr) {
          if (!e[temp]) {
            obj[temp] = "";
          }
        }
        surveyDataArr[index] = {
          ...e,
          ...obj,
        };
      }
    });

    let arr = [];

    surveyDataArr = surveyDataArr.filter((e) => e["ratee_name"] !== "");
    for (let obj of surveyDataArr) {
      let newObj = {};
      let status = Status.no_conflicts;
      let categories = {};

      Object.keys(obj).map((e) => {
        let val: string = obj[e]?.toString();
        if ((e === "ratee_email" || e.includes("email")) && val != "") {
          if (!this.validateEmail(val)) {
            status = Status.improper_incomplete_data;
          }
        }

        if (e.includes("&")) {
          const fieldMap = this.getFieldMap(e);

          if (categories[fieldMap["name"]]) {
            categories[fieldMap["name"]][+fieldMap["index"] - 1] = {
              ...categories[fieldMap["name"]][+fieldMap["index"] - 1],
              [fieldMap["field"]]: obj[e],
            };
          } else {
            categories[fieldMap["name"]] = [];

            categories[fieldMap["name"]][+fieldMap["index"] - 1] = {
              [fieldMap["field"]]: obj[e],
            };
          }
        } else {
          newObj[e] = obj[e];
        }
      });

      let ratee_status = Status.no_conflicts;

      // let contact = newObj["ratee_contact"]
      // if(contact)

      if (
        !newObj["ratee_name"] ||
        !newObj["ratee_contact"] ||
        !newObj["ratee_email"] ||
        !this.validateEmail(newObj["ratee_email"])
      ) {
        ratee_status = Status.improper_incomplete_data;
      }

      newObj = {
        status,
        ratee_status,
        ...newObj,
      };

      newObj["categories"] = Object.entries(categories).map(([key, value]) => ({
        category_name: key.replace(/_/g, " "),
        respondents: value,
      }));
      arr.push(newObj);
    }

    let usersObj = {};
    let requiredCateory = [];
    let categories = {};
    for (let [index, ratee] of arr.entries()) {
      if (!usersObj[ratee.ratee_email]) {
        const [user] = await this.user
          .schema(this.requestParams.schema_name)
          .findOrBuild({
            where: { name: ratee.ratee_email },
            defaults: {
              email: ratee.ratee_email,
              name: ratee.ratee_name,
              contact: ratee.ratee_contact,
              tenant_id: this.requestParams.tenant.id,
            },
          });
        usersObj[user.email] = {
          id: user.id,
          email: user.email,
          name: user.name,
        };
        arr[index] = {
          ratee_id: user.id,
          ...arr[index],
        };
      } else {
        arr[index] = {
          ratee_id: usersObj[ratee.ratee_email].id,
          ...arr[index],
        };
      }

      let no_resp = 0;
      let count = 0;

      for (let [index, category] of ratee.categories.entries()) {
        let categoryData;
        if (!categories[category.category_name]) {
          categoryData = await this.rater
            .schema(this.requestParams.schema_name)
            .findOne({
              where: {
                name: category.category_name,
                survey_description_id: null,
              },
              attributes: {
                exclude: [
                  "createdAt",
                  "updatedAt",
                  "deletedAt",
                  "can_be_deleted",
                ],
              },
            });
          categories[category.category_name] = categoryData;
        } else {
          categoryData = categories[category.category_name];
        }
        if (!categoryData) {
          throw new NotFoundException(
            `${category.category_name} Category does not exist`
          );
        }
        if (categoryData.is_required) {
          requiredCateory.push(categoryData.name);
        }

        ratee.categories[index] = {
          category_id: categoryData.id,
          category_short_name: categoryData.short_name,
          category_no_of_raters: categoryData.no_of_raters,
          category_is_required: categoryData.is_required,
          is_external: categoryData.is_external,
          ...ratee.categories[index],
        };

        no_resp = no_resp + categoryData.no_of_raters;

        for (let [i, respondent] of category.respondents.entries()) {
          if (respondent.email != "") {
            count++;
          }
          let resp_status = Status.improper_incomplete_data;

          if (
            this.validateEmail(respondent.email) ||
            (!categoryData.is_required && respondent.email === "")
          ) {
            resp_status = Status.no_conflicts;
          }
          if (!usersObj[respondent.email] || respondent.email === "") {
            const [respondentData] = await this.user
              .schema(this.requestParams.schema_name)
              .findOrBuild({
                where: { email: respondent.email },
                defaults: {
                  email: respondent.email,
                  name: respondent.name,
                  tenant_id: this.requestParams.tenant.id,
                },
              });
            usersObj[respondentData.email] = {
              id: respondentData.id,
              email: respondentData.email,
              name: respondentData.name,
              resp_status,
            };

            category.respondents[i] = {
              id: respondentData.id,
              resp_status,
              ...category.respondents[i],
            };
          } else {
            category.respondents[i] = {
              id: usersObj[respondent.email]?.id,
              resp_status,
              ...category.respondents[i],
            };
          }
          // }
        }
      }

      ratee.categories.forEach((e) => {
        e["no_respondents"] = e.respondents.filter((e) => e.email != "").length;
        if (
          e["no_respondents"] !== e["category_no_of_raters"] &&
          e["category_is_required"] === true
        ) {
          e["incomplete"] = true;

          arr[index]["status"] = Status.improper_incomplete_data;
        } else {
          e["incomplete"] = false;
        }
      });

      arr[index] = {
        ...arr[index],
        raters_assigned: `${count}/${no_resp}`,
        // status:
        //   no_resp !== count
        //     ? Status.improper_incomplete_data
        //     : arr[index].status,
      };
    }

    let categoryNames = [];
    arr.forEach((e) => {
      e.categories.forEach((element) => {
        categoryNames.push(element.category_name);
      });
      let checker = requiredCateory.every((v) => categoryNames.includes(v));
      if (!checker) {
        e.status = Status.improper_incomplete_data;
      }
      categoryNames.length = 0;
    });

    unlink(file.path, (err) => {
      console.log("done...", err);
    });

    this.usersRepeatCheck(arr, false);

    return arr;
  }

  async CreateExcelSurveyNew(file: any) {
    try {
      const workbook = XLSX.readFile(file.path);

      const sheetData = XLSX.utils.sheet_to_json(
        workbook.Sheets["Sample NbolSurvey Excel"]
      );

      let arr = [];
      let allcategories = [];
      let allcategorieswithduplicates2 = [];
      allcategories = [
        ...new Set(sheetData.map((e) => e["Relationship To Ratee"])),
      ];
      allcategorieswithduplicates2 = sheetData.map(
        (e) => e["Relationship To Ratee"]
      );
      const newArray = allcategorieswithduplicates2
        .slice(0, allcategorieswithduplicates2.indexOf("Self", 1) + 1)
        .filter((item) => item !== "Self");

      let dbCategories = {};

      const categories = JSON.parse(
        JSON.stringify(
          await this.rater.schema(this.requestParams.schema_name).findAll({
            where: {
              category_name: allcategories.filter((item) => item !== "Self"),
              survey_description_id: null,
            },
          })
        )
      );

      const sumcategories = categories.reduce(
        (acc, curr) => acc + curr.no_of_raters,
        0
      );

      for (const category of categories) {
        dbCategories[category.category_name] = {
          ...category,
          respondents: Array(category.no_of_raters)
            .fill({
              designation: "",
              department: "",
              email: "",
              id: "",
              employee_code: "",
              name: "",
              contact: "",
              resp_status: Status.improper_incomplete_data,
            })
            .map((item) => ({ ...item, id: randomUUID() })),
        };
      }

      if (!categories.length) {
        throw new BadRequestException(
          "Please use proper excel format, or download new excel."
        );
      }

      if (
        !allcategories
          .filter((item) => item !== "Self")
          .every((category) => Object.keys(dbCategories).includes(category)) ||
        sumcategories != newArray.length
      ) {
        throw new BadRequestException(
          "Excel format being uploaded does not match with the present Rater Configuration. Please download sample excel and upload as per latest format."
        );
      }

      for (let obj of sheetData) {
        let newObj = {};
        let ratee_status = Status.no_conflicts;
        let status = Status.no_conflicts;

        if (obj["Rater Email Address"]) {
          if (!this.validateEmail(obj["Rater Email Address"])) {
            status = Status.improper_incomplete_data;
          }
        } else {
          status = Status.improper_incomplete_data;
        }

        if (
          [
            "Rater Full Name",
            "Rater Email Address",
            "Relationship To Ratee",
          ].every((key) => !!obj[key])
        ) {
          newObj = {
            status,
            ratee_status,
            employee_code: obj["ID"],
            ratee_contact: obj["Rater Contact"] ? obj["Rater Contact"] : "",
            ratee_department: obj["Ratee Department"]
              ? obj["Ratee Department"]
              : "",
            ratee_designation: obj["Ratee Designation"]
              ? obj["Ratee Designation"]
              : "",
            ratee_email: obj["Rater Email Address"]
              ? obj["Rater Email Address"]
              : "",
            ratee_name: obj["Rater Full Name"] ? obj["Rater Full Name"] : "",
            category: obj["Relationship To Ratee"]
              ? obj["Relationship To Ratee"]
              : "",
          };

          arr.push(JSON.parse(JSON.stringify(newObj)));
        } else if (
          ["Rater Full Name", "Rater Email Address"].some((key) => !!obj[key])
        ) {
          ratee_status = Status.improper_incomplete_data;
          status = Status.improper_incomplete_data;
          newObj = {
            status,
            ratee_status,
            employee_code: obj["ID"],
            ratee_contact: obj["Rater Contact"] ? obj["Rater Contact"] : "",
            ratee_department: obj["Ratee Department"]
              ? obj["Ratee Department"]
              : "",
            ratee_designation: obj["Ratee Designation"]
              ? obj["Ratee Designation"]
              : "",
            ratee_email: obj["Rater Email Address"]
              ? obj["Rater Email Address"]
              : "",
            ratee_name: obj["Rater Full Name"] ? obj["Rater Full Name"] : "",
            category: obj["Relationship To Ratee"]
              ? obj["Relationship To Ratee"]
              : "",
          };

          arr.push(JSON.parse(JSON.stringify(newObj)));
        }

        // Object.keys(obj).map((e) => {
        //   let val: string = obj[e]?.toString();
        //   if (e === "Rater Email Address" && val != "") {
        //     if (!this.validateEmail(val)) {
        //       status = Status.improper_incomplete_data;
        //     }
        //   }

        //   const allValuesPresent = [
        //     "ID",
        //     "Rater Full Name",
        //     "Rater Email Address",
        //     "Relationship To Ratee",
        //   ].every((val) => !!obj[val]);

        //   if (!allValuesPresent) {
        //     if (obj[e] === "Self") {
        //       ratee_status = Status.improper_incomplete_data;
        //     }
        //     status = Status.improper_incomplete_data;
        //     newObj = {
        //       status,
        //       ratee_status,
        //       ratee_contact: obj["Rater Contact"] ? obj["Rater Contact"] : "",
        //       ratee_department: obj["Ratee Department"]
        //         ? obj["Ratee Department"]
        //         : "",
        //       ratee_designation: obj["Ratee Designation"]
        //         ? obj["Ratee Designation"]
        //         : "",
        //       ratee_email: obj["Rater Email Address"]
        //         ? obj["Rater Email Address"]
        //         : "",
        //       ratee_name: obj["Rater Full Name"] ? obj["Rater Full Name"] : "",
        //       category: obj["Relationship To Ratee"]
        //         ? obj["Relationship To Ratee"]
        //         : "",
        //     };

        //     arr.push(JSON.parse(JSON.stringify(newObj)));
        //   }
        // });
      }
      let usersObj = {};
      let finalArr = [];
      let currentRateeIndex = 0;
      // let raters_assigned = 0;
      let resp_count = 0;

      let respondentIndex = {};
      for (let [index, ratee] of arr.entries()) {
        if (!usersObj[ratee.ratee_email]) {
          const isTenantuser = await this.tenantUser
            .schema(DB_PUBLIC_SCHEMA)
            .findOne({
              where: { email: ratee.ratee_email },
              include: [{ model: Tenant }],
            });

          if (isTenantuser) {
            if (isTenantuser?.my_tenant?.is_channel_partner) {
              throw new BadRequestException(
                `User with this (${ratee.ratee_email}) email already exists!`
              );
            }

            if (
              isTenantuser?.my_tenant?.schema_name !==
              this.requestParams.schema_name
            ) {
              const isUserInTenant = await User.schema(
                isTenantuser?.my_tenant?.schema_name
              ).findOne({
                where: { email: ratee.ratee_email },
              });

              if (isUserInTenant)
                throw new BadRequestException(
                  `User with this (${ratee.ratee_email}) email already exists!`
                );
            }
          }
          const [user] = await this.user
            .schema(this.requestParams.schema_name)
            .findOrBuild({
              where: { email: ratee.ratee_email },
              defaults: {
                email: ratee.ratee_email,
                employee_code: ratee.employee_code,
                name: ratee["Rater Full Name"],
                contact: ratee["Rater Contact"],
                tenant_id: this.requestParams.tenant.id,
              },
            });

          usersObj[user.email] = {
            id: user.id,
            email: user.email,
            employee_code: user.employee_code,
            name: user.name,
          };
        }
        // else {
        //   if (ratee.category === "Self") {
        //     throw new BadRequestException(
        //       `Email ${ratee.ratee_email} already exist in excel `
        //     );
        //   }
        // }

        if (ratee.category === "Self") {
          // raters_assigned = 0;
          // if (index + 1) {
          resp_count = 0;
          // }
          respondentIndex = {};
          finalArr[currentRateeIndex] = {
            ratee_id: usersObj[ratee.ratee_email].id,
            ...arr[index],
            categories: JSON.parse(JSON.stringify(dbCategories)),
          };
          if (index + 1 === arr.length) {
            // finalArr[currentRateeIndex][
            //   "raters_assigned"
            // ] = `${raters_assigned}/${resp_count}`;

            finalArr[currentRateeIndex]["categories"] = Object.values(
              finalArr[currentRateeIndex]["categories"]
            ).map((obj: any) => {
              obj.resp_count = obj.respondents.length;
              // obj.incomplete = raters_assigned < resp_count ? true : false;
              return obj;
            });
          }
        } else {
          // ratee.status === Status.no_conflicts && raters_assigned++;
          resp_count++;

          if (!respondentIndex[ratee.category]) {
            respondentIndex[ratee.category] = 0;
          }

          finalArr[currentRateeIndex]["categories"][ratee.category][
            "respondents"
          ].splice(respondentIndex[ratee.category], 1, {
            designation: ratee.ratee_designation,
            department: ratee.ratee_department,
            email: ratee.ratee_email,
            employee_code: ratee.employee_code,
            id: usersObj[ratee.ratee_email].id,
            name: ratee.ratee_name,
            contact: ratee?.ratee_contact,
            resp_status: ratee.status,
          });
          respondentIndex[ratee.category] = respondentIndex[ratee.category] + 1;

          if (index + 1 === arr.length) {
            // finalArr[currentRateeIndex][
            //   "raters_assigned"
            // ] = `${raters_assigned}/${resp_count}`;

            finalArr[currentRateeIndex]["categories"] = Object.values(
              finalArr[currentRateeIndex]["categories"]
            ).map((obj: any) => {
              obj.resp_count = obj.respondents.length;
              // obj.incomplete = raters_assigned < resp_count ? true : false;
              return obj;
            });
          } else if (arr[index + 1] && arr[index + 1].category === "Self") {
            // finalArr[currentRateeIndex][
            //   "raters_assigned"
            // ] = `${raters_assigned}/${resp_count}`;

            finalArr[currentRateeIndex]["categories"] = Object.values(
              finalArr[currentRateeIndex]["categories"]
            ).map((obj: any) => {
              obj.resp_count = obj.respondents.length;
              // obj.incomplete = raters_assigned < resp_count ? true : false;
              return obj;
            });
            currentRateeIndex++;
          }
        }
      }

      let rateeEmailArr = [];
      let total_respondents;
      let raters_assigned;
      for (const ratee of finalArr) {
        total_respondents = 0;
        raters_assigned = 0;
        let respondentsEmailArr = [];
        if (
          !ratee.ratee_email ||
          !this.validateEmail(ratee.ratee_email) ||
          !ratee.ratee_name
        ) {
          ratee["ratee_status"] = Status.improper_incomplete_data;
        }
        for (const categories of ratee.categories) {
          total_respondents = total_respondents + categories.resp_count;
          for (const respondant of categories.respondents) {
            respondant.resp_status === Status.no_conflicts && raters_assigned++;
            if (
              respondant.email &&
              respondentsEmailArr.includes(respondant.email)
            ) {
              throw new BadRequestException(
                `Same Respondent (${respondant.email}) already exist in excel for same ratee`
              );
            }
            respondentsEmailArr.push(respondant.email);
          }
        }
        if (raters_assigned <= 0) {
          ratee["status"] = Status.improper_incomplete_data;
        }
        ratee.total_respodents = total_respondents;
        ratee.raters_assigned = `${raters_assigned}/${total_respondents}`;
        if (
          ratee.ratee_email &&
          respondentsEmailArr.includes(ratee.ratee_email)
        ) {
          throw new BadRequestException(
            `Ratee Email (${ratee.ratee_email}) should not repeat in respondents`
          );
        }

        if (rateeEmailArr.includes(ratee.ratee_email)) {
          throw new BadRequestException(
            `Ratee Email (${ratee.ratee_email}) already exist in excel`
          );
        }
        rateeEmailArr.push(ratee.ratee_email);
      }

      return finalArr;
    } catch (error) {
      console.log(error);

      throw error;

      // throw new BadRequestException("Please user propper excel format");
    }
  }
  async CreateExcelSurveyNewAddRatee(file: any, id: string) {
    try {
      const workbook = XLSX.readFile(file.path);

      const sheetData = XLSX.utils.sheet_to_json(
        workbook.Sheets["Sample NbolSurvey Excel"]
      );

      let arr = [];
      let allcategories = [];
      allcategories = [
        ...new Set(sheetData.map((e) => e["Relationship To Ratee"])),
      ];

      let dbCategories = {};

      const categories = JSON.parse(
        JSON.stringify(
          await this.rater.schema(this.requestParams.schema_name).findAll({
            where: {
              category_name: allcategories.filter((item) => item !== "Self"),
              survey_description_id: id,
            },
          })
        )
      );

      for (const category of categories) {
        dbCategories[category.category_name] = {
          ...category,
          respondents: Array(category.no_of_raters)
            .fill({
              designation: "",
              department: "",
              email: "",
              id: "",
              employee_code: "",
              name: "",
              contact: "",
              resp_status: Status.improper_incomplete_data,
            })
            .map((item) => ({ ...item, id: randomUUID() })),
        };
      }

      if (!categories.length) {
        throw new BadRequestException(
          "Please use proper excel format, or download new excel."
        );
      }

      if (
        !allcategories
          .filter((item) => item !== "Self")
          .every((category) => Object.keys(dbCategories).includes(category))
      ) {
        throw new BadRequestException(
          "Excel format being uploaded does not match with the present Rater Configuration. Please download sample excel and upload as per latest format."
        );
      }

      for (let obj of sheetData) {
        let newObj = {};
        let ratee_status = Status.no_conflicts;
        let status = Status.no_conflicts;

        if (obj["Rater Email Address"]) {
          if (!this.validateEmail(obj["Rater Email Address"])) {
            status = Status.improper_incomplete_data;
          }
        } else {
          status = Status.improper_incomplete_data;
        }

        if (
          [
            "Rater Full Name",
            "Rater Email Address",
            "Relationship To Ratee",
          ].every((key) => !!obj[key])
        ) {
          newObj = {
            status,
            ratee_status,
            employee_code: obj["ID"],
            ratee_contact: obj["Rater Contact"] ? obj["Rater Contact"] : "",
            ratee_department: obj["Ratee Department"]
              ? obj["Ratee Department"]
              : "",
            ratee_designation: obj["Ratee Designation"]
              ? obj["Ratee Designation"]
              : "",
            ratee_email: obj["Rater Email Address"]
              ? obj["Rater Email Address"]
              : "",
            ratee_name: obj["Rater Full Name"] ? obj["Rater Full Name"] : "",
            category: obj["Relationship To Ratee"]
              ? obj["Relationship To Ratee"]
              : "",
          };

          arr.push(JSON.parse(JSON.stringify(newObj)));
        } else if (
          ["Rater Full Name", "Rater Email Address"].some((key) => !!obj[key])
        ) {
          ratee_status = Status.improper_incomplete_data;
          status = Status.improper_incomplete_data;
          newObj = {
            status,
            ratee_status,
            employee_code: obj["ID"],
            ratee_contact: obj["Rater Contact"] ? obj["Rater Contact"] : "",
            ratee_department: obj["Ratee Department"]
              ? obj["Ratee Department"]
              : "",
            ratee_designation: obj["Ratee Designation"]
              ? obj["Ratee Designation"]
              : "",
            ratee_email: obj["Rater Email Address"]
              ? obj["Rater Email Address"]
              : "",
            ratee_name: obj["Rater Full Name"] ? obj["Rater Full Name"] : "",
            category: obj["Relationship To Ratee"]
              ? obj["Relationship To Ratee"]
              : "",
          };

          arr.push(JSON.parse(JSON.stringify(newObj)));
        }

        // Object.keys(obj).map((e) => {
        //   let val: string = obj[e]?.toString();
        //   if (e === "Rater Email Address" && val != "") {
        //     if (!this.validateEmail(val)) {
        //       status = Status.improper_incomplete_data;
        //     }
        //   }

        //   const allValuesPresent = [
        //     "ID",
        //     "Rater Full Name",
        //     "Rater Email Address",
        //     "Relationship To Ratee",
        //   ].every((val) => !!obj[val]);

        //   if (!allValuesPresent) {
        //     if (obj[e] === "Self") {
        //       ratee_status = Status.improper_incomplete_data;
        //     }
        //     status = Status.improper_incomplete_data;
        //     newObj = {
        //       status,
        //       ratee_status,
        //       ratee_contact: obj["Rater Contact"] ? obj["Rater Contact"] : "",
        //       ratee_department: obj["Ratee Department"]
        //         ? obj["Ratee Department"]
        //         : "",
        //       ratee_designation: obj["Ratee Designation"]
        //         ? obj["Ratee Designation"]
        //         : "",
        //       ratee_email: obj["Rater Email Address"]
        //         ? obj["Rater Email Address"]
        //         : "",
        //       ratee_name: obj["Rater Full Name"] ? obj["Rater Full Name"] : "",
        //       category: obj["Relationship To Ratee"]
        //         ? obj["Relationship To Ratee"]
        //         : "",
        //     };

        //     arr.push(JSON.parse(JSON.stringify(newObj)));
        //   }
        // });
      }
      let usersObj = {};
      let finalArr = [];
      let currentRateeIndex = 0;
      // let raters_assigned = 0;
      let resp_count = 0;

      let respondentIndex = {};
      for (let [index, ratee] of arr.entries()) {
        if (!usersObj[ratee.ratee_email]) {
          const isTenantuser = await this.tenantUser
            .schema(DB_PUBLIC_SCHEMA)
            .findOne({
              where: { email: ratee.ratee_email },
              include: [{ model: Tenant }],
            });

          if (isTenantuser) {
            if (isTenantuser?.my_tenant?.is_channel_partner) {
              throw new BadRequestException(
                `User with this (${ratee.ratee_email}) email already exists!`
              );
            }

            if (
              isTenantuser?.my_tenant?.schema_name !==
              this.requestParams.schema_name
            ) {
              const isUserInTenant = await User.schema(
                isTenantuser?.my_tenant?.schema_name
              ).findOne({
                where: { email: ratee.ratee_email },
              });

              if (isUserInTenant)
                throw new BadRequestException(
                  `User with this (${ratee.ratee_email}) email already exists!`
                );
            }
          }
          const [user] = await this.user
            .schema(this.requestParams.schema_name)
            .findOrBuild({
              where: { email: ratee.ratee_email },
              defaults: {
                email: ratee.ratee_email,
                employee_code: ratee.employee_code,
                name: ratee["Rater Full Name"],
                contact: ratee["Rater Contact"],
                tenant_id: this.requestParams.tenant.id,
              },
            });

          usersObj[user.email] = {
            id: user.id,
            email: user.email,
            employee_code: user.employee_code,
            name: user.name,
          };
        }
        // else {
        //   if (ratee.category === "Self") {
        //     throw new BadRequestException(
        //       `Email ${ratee.ratee_email} already exist in excel `
        //     );
        //   }
        // }

        if (ratee.category === "Self") {
          // raters_assigned = 0;
          // if (index + 1) {
          resp_count = 0;
          // }
          respondentIndex = {};
          finalArr[currentRateeIndex] = {
            ratee_id: usersObj[ratee.ratee_email].id,
            ...arr[index],
            categories: JSON.parse(JSON.stringify(dbCategories)),
          };
          if (index + 1 === arr.length) {
            // finalArr[currentRateeIndex][
            //   "raters_assigned"
            // ] = `${raters_assigned}/${resp_count}`;

            finalArr[currentRateeIndex]["categories"] = Object.values(
              finalArr[currentRateeIndex]["categories"]
            ).map((obj: any) => {
              obj.resp_count = obj.respondents.length;
              // obj.incomplete = raters_assigned < resp_count ? true : false;
              return obj;
            });
          }
        } else {
          // ratee.status === Status.no_conflicts && raters_assigned++;
          resp_count++;

          if (!respondentIndex[ratee.category]) {
            respondentIndex[ratee.category] = 0;
          }

          finalArr[currentRateeIndex]["categories"][ratee.category][
            "respondents"
          ].splice(respondentIndex[ratee.category], 1, {
            designation: ratee.ratee_designation,
            department: ratee.ratee_department,
            email: ratee.ratee_email,
            employee_code: ratee.employee_code,
            id: usersObj[ratee.ratee_email].id,
            name: ratee.ratee_name,
            contact: ratee?.ratee_contact,
            resp_status: ratee.status,
          });
          respondentIndex[ratee.category] = respondentIndex[ratee.category] + 1;

          if (index + 1 === arr.length) {
            // finalArr[currentRateeIndex][
            //   "raters_assigned"
            // ] = `${raters_assigned}/${resp_count}`;

            finalArr[currentRateeIndex]["categories"] = Object.values(
              finalArr[currentRateeIndex]["categories"]
            ).map((obj: any) => {
              obj.resp_count = obj.respondents.length;
              // obj.incomplete = raters_assigned < resp_count ? true : false;
              return obj;
            });
          } else if (arr[index + 1] && arr[index + 1].category === "Self") {
            // finalArr[currentRateeIndex][
            //   "raters_assigned"
            // ] = `${raters_assigned}/${resp_count}`;

            finalArr[currentRateeIndex]["categories"] = Object.values(
              finalArr[currentRateeIndex]["categories"]
            ).map((obj: any) => {
              obj.resp_count = obj.respondents.length;
              // obj.incomplete = raters_assigned < resp_count ? true : false;
              return obj;
            });
            currentRateeIndex++;
          }
        }
      }

      let rateeEmailArr = [];
      let total_respondents;
      let raters_assigned;
      for (const ratee of finalArr) {
        total_respondents = 0;
        raters_assigned = 0;
        let respondentsEmailArr = [];
        if (
          !ratee.ratee_email ||
          !this.validateEmail(ratee.ratee_email) ||
          !ratee.ratee_name
        ) {
          ratee["ratee_status"] = Status.improper_incomplete_data;
        }
        for (const categories of ratee.categories) {
          total_respondents = total_respondents + categories.resp_count;
          for (const respondant of categories.respondents) {
            respondant.resp_status === Status.no_conflicts && raters_assigned++;
            if (
              respondant.email &&
              respondentsEmailArr.includes(respondant.email)
            ) {
              throw new BadRequestException(
                `Same Respondent (${respondant.email}) already exist in excel for same ratee`
              );
            }
            respondentsEmailArr.push(respondant.email);
          }
        }
        if (raters_assigned <= 0) {
          ratee["status"] = Status.improper_incomplete_data;
        }
        ratee.total_respodents = total_respondents;
        ratee.raters_assigned = `${raters_assigned}/${total_respondents}`;
        if (
          ratee.ratee_email &&
          respondentsEmailArr.includes(ratee.ratee_email)
        ) {
          throw new BadRequestException(
            `Ratee Email (${ratee.ratee_email}) should not repeat in respondents`
          );
        }

        if (rateeEmailArr.includes(ratee.ratee_email)) {
          throw new BadRequestException(
            `Ratee Email (${ratee.ratee_email}) already exist in excel`
          );
        }
        rateeEmailArr.push(ratee.ratee_email);
      }

      return finalArr;
    } catch (error) {
      console.log(error);

      throw error;

      // throw new BadRequestException("Please user propper excel format");
    }
  }

  async saveSurvey(data: ExcelSurveyRespondentsDTO[], survey: ExcelSurveyDTO) {
    await this.draftSurvey.schema(this.requestParams.schema_name).destroy({
      where: { title: survey.title },
      transaction: this.requestParams.transaction,
    });

    return await this.draftSurvey.schema(this.requestParams.schema_name).create(
      {
        title: survey.title,
        client_contact: survey.client_contact,
        description: survey.description,
        date: survey.end_date,
        data: JSON.parse(JSON.stringify(data)),
      },
      { transaction: this.requestParams.transaction }
    );
  }

  async launchSurvey(
    data: ExcelSurveyRespondentsDTO[],
    survey: CreateSurveyDTO
  ) {
    let usersArr = [];
    let rateeIdArr = [];
    let catergoryIdArr = [];
    let usersObj = {};
    // let designations = []

    this.usersRepeatCheck(data, true);
    // data.forEach((ratee) => {
    for await (const ratee of data) {
      if (ratee.status === Status.improper_incomplete_data) {
        throw new BadRequestException(
          "All Recipients status should be No Conflicts"
        );
      }
      let obj = {};
      let department;
      if (ratee.ratee_department) {
        [department] = await this.department
          .schema(this.requestParams.schema_name)
          .findOrCreate({
            where: { name: ratee.ratee_department },
            defaults: {
              name: ratee.ratee_department,
            },
          });
      }
      let designation;
      if (ratee.ratee_designation) {
        [designation] = await this.designation
          .schema(this.requestParams.schema_name)
          .findOrCreate({
            where: { name: ratee.ratee_designation },
            defaults: {
              name: ratee.ratee_designation,
            },
          });
      }
      // obj["id"] = ratee.ratee_id;
      obj["name"] = ratee.ratee_name;
      obj["email"] = ratee.ratee_email;
      obj["employee_code"] = ratee.employee_code;
      obj["contact"] = ratee.ratee_contact;
      obj["department_id"] = department?.id || null;
      obj["designation_id"] = designation?.id || null;

      if (usersObj[ratee.ratee_email]) {
        // usersArr.push({ ...usersObj[ratee.ratee_email], ...obj });
      } else {
        let [user, created] = await this.user
          .schema(this.requestParams.schema_name)
          .findOrBuild({
            where: {
              email: ratee.ratee_email,
            },
            defaults: { ...obj },
          });
        usersObj[ratee.ratee_email] = JSON.parse(JSON.stringify(user));
        obj["department_id"] =
          department?.id || usersObj[ratee.ratee_email].department_id || null;
        obj["designation_id"] =
          designation?.id || usersObj[ratee.ratee_email].designation_id || null;
        obj["id"] = user.id || usersObj[ratee.ratee_email].id;
        usersArr.push({
          ...JSON.parse(JSON.stringify(user)),
          ...obj,
          tenant_id: this.requestParams.tenant.id,
        });
      }

      rateeIdArr.push(ratee.ratee_id);
      // departments.push(ratee.ratee_department)
      // designations.push(ratee.ratee_designation)
      obj = {};
      // ratee.categories.forEach((category) => {
      for await (const category of ratee.categories) {
        catergoryIdArr.push(category.category_id);
        if (!category.is_external) {
          // category.respondents.forEach((resp) => {
          for await (const resp of category.respondents) {
            if (resp.id && resp.email) {
              if (resp.designation) {
                let [respDesignation, desCreated] = await this.designation
                  .schema(this.requestParams.schema_name)
                  .findOrCreate({
                    where: { name: resp.designation },
                    defaults: {
                      name: resp.designation,
                    },
                  });
                obj["designation_id"] = respDesignation?.id || null;
              }
              // obj["id"] = resp.id;
              obj["email"] = resp.email;
              obj["name"] = resp.name;
              obj["employee_code"] = resp.employee_code;
              if (usersObj[resp.email]) {
                // usersArr.push({ ...usersObj[resp.email], ...obj });
                resp.id = usersObj[resp.email].id;
              } else {
                let [user, created] = await this.user
                  .schema(this.requestParams.schema_name)
                  .findOrBuild({
                    where: {
                      email: resp.email,
                    },
                    defaults: { ...obj },
                  });
                usersObj[resp.email] = JSON.parse(JSON.stringify(user));
                obj["department_id"] =
                  department?.id || usersObj[resp.email].department_id || null;
                obj["designation_id"] =
                  designation?.id ||
                  usersObj[resp.email].designation_id ||
                  null;
                obj["id"] = user.id || usersObj[ratee.ratee_email].id;
                usersArr.push({
                  ...JSON.parse(JSON.stringify(user)),
                  ...obj,
                  tenant_id: this.requestParams.tenant.id,
                });
              }
            }
            obj = {};
          }
        }
      }
    }

    // const createdDepartments = await this.department.bulkCreate(departments,{
    //   updateOnDuplicate:['name']
    // })
    // const createdDesignation = await this.department.bulkCreate(designations,{
    //   updateOnDuplicate:['name']
    // })

    usersArr = usersArr.filter(
      (value, index, self) =>
        index === self.findIndex((t) => t.email === value.email)
    );

    const users = await this.user
      .schema(this.requestParams.schema_name)
      .bulkCreate(usersArr, {
        returning: true,
        updateOnDuplicate: [
          "id",
          "name",
          "email",
          "employee_code",
          "contact",
          "designation_id",
          "department_id",
        ],
      });

    const createdSurvey = await this.surveyService.createSurvey(
      { ...survey, employees: users.map((item) => item.id) },
      catergoryIdArr
    );

    const surveys = await this.survey
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          survey_id: createdSurvey.id,
        },
        include: [
          {
            model: SurveyDescription,
            attributes: ["title", "id"],
          },
          {
            model: User,
            include: [
              {
                model: User,
                as: "line_manager",
                attributes: ["id", "name", "email", "password"],
              },
              {
                model: Designation,
                attributes: ["name"],
              },
            ],
            attributes: ["name", "email"],
          },
        ],
      });

    for (const survey of surveys) {
      let externalCategoryArr = [];
      let internalCategoryArr = [];

      let ratee = data.find(({ ratee_id }) => {
        return ratee_id === survey.employee_id;
      });

      ratee.categories.forEach((category) => {
        category.respondents.forEach((resp) => {
          if (resp.id && resp.email) {
            let dataTmp = {
              respondant_id: resp.id,
              respondant_email: resp.email,
              respondant_name: resp.name,
              relationship_with_employee_id: category.category_id,
            };
            if (category.is_external) {
              externalCategoryArr.push(dataTmp);
            } else {
              internalCategoryArr.push(dataTmp);
            }
          }
        });
      });

      let body = {
        survey_id: survey.id,
        surveyRespondents: [...internalCategoryArr],
        externalSurveyRespondents: [...externalCategoryArr],
      };

      await this.surveyService.addResponedents(body, true, ratee.ratee_id);
      await this.launchSurveyProcess(survey, survey.id);
    }

    return "done";
  }

  async launchSurveyNew(
    data: ExcelSurveyRespondentsDTO[],
    survey: CreateSurveyDTO
  ) {
    this.usersRepeatCheck(data, true);
    const transaction = await this.sequelize.transaction();
    try {
      const questionnaireFromDB = await this.questionnaire
        .schema(this.requestParams.schema_name)
        .findOne({
          where: { id: survey.questionnaire_id },
          include: {
            model: Competency,
            required: false,
            include: [
              {
                model: Question,
                include: [
                  {
                    model: QuestionnaireQuestion,
                    where: { questionnaire_id: survey.questionnaire_id },
                  },
                  {
                    model: AreaAssessment,
                    required: false,
                  },
                  {
                    model: QuestionResponse,
                  },
                ],
              },
            ],
          },
        });

      // now we are creating a copy/version of questionnaire so that in future we can use copy/version to create reports
      const questionnaire = await this.questionnaire
        .schema(this.requestParams.schema_name)
        .create({
          title: questionnaireFromDB.title,
          description: questionnaireFromDB.description,
          no_of_questions: questionnaireFromDB.no_of_questions,
          is_copy: true,
        });

      let questionnaireCompetencies = [];
      let questionnaireQuestions = [];
      let questionResponses = [];
      let questionAreaAssessment = [];

      for (const competency of questionnaireFromDB.competencies) {
        const competencyCreated = await this.competency
          .schema(this.requestParams.schema_name)
          .create(
            {
              title: competency.title,
              description: competency.description,
              is_copy: true,
              no_of_questions: competency.no_of_questions,
              type: competency.type,
            },
            { transaction }
          );

        questionnaireCompetencies.push({
          questionnaire_id: questionnaire.id,
          competency_id: competencyCreated.id,
          no_of_questions:
            competency["QuestionnaireCompetency"]["no_of_questions"],
          order: competency["QuestionnaireCompetency"]["order"],
          is_copy: true,
        });

        for (const question of competency.questions) {
          const createdQuestion = await this.question
            .schema(this.requestParams.schema_name)
            .create(
              {
                ...question["dataValues"],
                id: undefined,
                competency_id: competencyCreated.id,
                is_copy: true,
              },
              { transaction }
            );

          questionnaireQuestions.push({
            questionnaire_id: questionnaire.id,
            question_id: createdQuestion.id,
            order: question.questionnaireQuestion[0].order,
            is_copy: true,
          });
          for (const areaAssessment of question.area_assessments) {
            questionAreaAssessment.push({
              question_id: createdQuestion.id,
              area_assessment_id: areaAssessment.id,
              is_copy: true,
            });
          }

          for (const response of question.responses) {
            questionResponses.push({
              type: response.type,
              label: response.label,
              score: response.score,
              question_id: createdQuestion.id,
              is_copy: true,
              order: response.order,
            });
          }
        }
      }

      await this.questionnaireCompetency
        .schema(this.requestParams.schema_name)
        .bulkCreate(questionnaireCompetencies, {
          transaction,
        });
      await this.questionnaireQuestion
        .schema(this.requestParams.schema_name)
        .bulkCreate(questionnaireQuestions, {
          transaction,
        });
      await this.questionResponse
        .schema(this.requestParams.schema_name)
        .bulkCreate(questionResponses, {
          transaction,
        });
      await this.questionAreaAssessment
        .schema(this.requestParams.schema_name)
        .bulkCreate(questionAreaAssessment, {
          transaction,
        });

      questionnaireCompetencies = null;
      questionnaireQuestions = null;
      questionResponses = null;
      questionAreaAssessment = null;

      const surveyDescription = await this.surveyDescription
        .schema(this.requestParams.schema_name)
        .build({
          status: SurveyDescriptionStatus.Ongoing,
          end_date: survey.end_date,
          title: survey.title,
          client_contact: survey.client_contact,
          description: survey.description,
          reminder_frequency: survey?.reminder_frequency,
          assessments_due: survey.employees.length,
          total_assessments: survey.employees.length,
          questionnaire_id: questionnaire.id,
        });
      await this.surveyDescription
        .schema(this.requestParams.schema_name)
        .create(surveyDescription["dataValues"], { transaction });

      const raters = await this.rater
        .schema(this.requestParams.schema_name)
        .findAll({
          where: {
            survey_description_id: null,
            // id: data[0] ? data[0].categories.map((item) => item.category_id) : [],
          },
        });

      let selfRater;
      const bulkBuildRaters = this.rater
        .schema(this.requestParams.schema_name)
        .bulkBuild(
          raters.map((rater) => {
            return {
              name: rater.name,
              category_name: rater.category_name,
              short_name: rater.short_name,
              can_be_deleted: rater.can_be_deleted,
              is_external: rater.is_external,
              order: rater.order,
              // is_required: rater.is_required,
              no_of_raters: rater.no_of_raters,
              survey_description_id: surveyDescription.id,
            };
          })
        );
      await this.rater.schema(this.requestParams.schema_name).bulkCreate(
        bulkBuildRaters.map((item) => item["dataValues"]),
        { transaction }
      );

      let departments = {};
      let department;
      let designations = {};
      let designation;
      let employees = [];
      let surveys = [];
      let respondents = [];
      let Allcategories = {};
      let externalRespondents = [];
      let alreadyFoundedUsers = {};

      bulkBuildRaters.forEach((item) => {
        if (item["dataValues"].name === "Self") {
          selfRater = JSON.parse(JSON.stringify(item["dataValues"]));
        }
        Allcategories[item["dataValues"].category_name] = item["dataValues"].id;
      });

      if (!selfRater) {
        selfRater = await this.rater
          .schema(this.requestParams.schema_name)
          .findOne({
            where: {
              name: "Self",
              survey_description_id: null,
            },
            attributes: ["id"],
          });
      }

      for await (const user of data) {
        // check if current user has any conflict
        if (user.status === Status.improper_incomplete_data) {
          throw new BadRequestException(
            "All Recipients status should be No Conflicts"
          );
        }
        if (user.ratee_department) {
          // check if department is already in departments or not if not in departments then create
          if (!departments[user.ratee_department]) {
            let newDepartment = await this.department
              .schema(this.requestParams.schema_name)
              .findOrCreate({
                where: { name: user.ratee_department },
                defaults: {
                  name: user.ratee_department,
                },
                transaction,
              });
            departments[user.ratee_department] = newDepartment[0];
          }
          department = departments[user.ratee_department];
        }
        if (user.ratee_designation) {
          // check if designation is already in designations or not if not in designations then create
          if (!designations[user.ratee_designation]) {
            let newDesignation = await this.designation
              .schema(this.requestParams.schema_name)
              .findOrCreate({
                where: { name: user.ratee_designation },
                defaults: {
                  name: user.ratee_designation,
                },
                transaction,
              });
            designations[user.ratee_designation] = newDesignation[0];
          }
          designation = designations[user.ratee_designation];
        }

        // check if this user is already there in already founded users object if not then finr or create then set in alreadyFoundedUsers
        if (!alreadyFoundedUsers[user.ratee_email]) {
          const isTenantuser = await this.tenantUser
            .schema(DB_PUBLIC_SCHEMA)
            .findOne({
              where: { email: user.ratee_email },
              include: [{ model: Tenant }],
            });

          if (isTenantuser) {
            if (isTenantuser.my_tenant.is_channel_partner) {
              throw new BadRequestException(
                `User with this (${user.ratee_email}) email already exists!`
              );
            }

            if (
              isTenantuser.my_tenant.schema_name !==
              this.requestParams.schema_name
            ) {
              const isUserInTenant = await User.schema(
                isTenantuser.my_tenant.schema_name
              ).findOne({
                where: { email: user.ratee_email },
              });
              if (isUserInTenant)
                throw new BadRequestException(
                  `User with this (${user.ratee_email}) email already exists!`
                );
            }
          }
          // find or create user from db
          const [newUser] = await this.user
            .schema(this.requestParams.schema_name)
            .findOrCreate({
              where: {
                email: user.ratee_email,
              },
              defaults: {
                name: user.ratee_name,
                email: user.ratee_email,
                contact: user.ratee_contact,
                employee_code: user.employee_code,
                department_id: user.ratee_department ? department?.id : null,
                designation_id: user.ratee_designation ? designation?.id : null,
                tenant_id: this.requestParams.tenant.id,
              },
              transaction,
            });
          alreadyFoundedUsers[user.ratee_email] = newUser;
        }

        let newUser = alreadyFoundedUsers[user.ratee_email];
        employees.push(newUser.id);
        let survey = this.survey.build({
          survey_id: surveyDescription.id,
          employee_id: newUser.id,
          status: SurveyStatus.Ongoing,
        });

        respondents.push({
          survey_id: survey.id,
          respondant_id: newUser.id,
          relationship_with_employee_id: selfRater.id,
          is_selected_by_system: true,
          is_approved_by_employee: true,
          is_approved_by_line_manager: true,
          status: SurveyRespondantStatus.Ongoing,
        });
        let number_of_respondents = 0;

        for (const category of user.categories) {
          if (!category.is_external) {
            for (const respondent of category.respondents) {
              let respondent_designation;
              if (respondent.designation) {
                // check if designation is already in designations or not if not in designations then create
                if (!designations[respondent.designation]) {
                  let newDesignation = await this.designation
                    .schema(this.requestParams.schema_name)
                    .findOrCreate({
                      where: { name: respondent.designation },
                      defaults: {
                        name: respondent.designation,
                      },
                      transaction,
                    });
                  designations[respondent.designation] = newDesignation[0];
                }
                respondent_designation = designations[respondent.designation];
              }
              if (respondent.email) {
                // check if this user is already there in already founded users object if not then finr or create then set in alreadyFoundedUsers
                if (!alreadyFoundedUsers[respondent.email]) {
                  const isTenantuser = await this.tenantUser
                    .schema(DB_PUBLIC_SCHEMA)
                    .findOne({
                      where: { email: respondent.email },
                      include: [{ model: Tenant.schema(DB_PUBLIC_SCHEMA) }],
                    });

                  if (isTenantuser) {
                    if (isTenantuser.my_tenant.is_channel_partner) {
                      throw new BadRequestException(
                        `User with this (${respondent.email}) email already exists!`
                      );
                    }
                    if (
                      isTenantuser.my_tenant.schema_name !==
                      this.requestParams.schema_name
                    ) {
                      const isUserInTenant = await User.schema(
                        isTenantuser.my_tenant.schema_name
                      ).findOne({
                        where: { email: user.ratee_email },
                      });
                      if (isUserInTenant)
                        throw new BadRequestException(
                          `User with this (${user.ratee_email}) email already exists!`
                        );
                    }
                  }
                  // find or create user from db
                  const [newRespondent] = await this.user
                    .schema(this.requestParams.schema_name)
                    .findOrCreate({
                      where: {
                        email: respondent.email,
                      },
                      defaults: {
                        name: respondent.name,
                        email: respondent.email,
                        employee_code: respondent.employee_code,
                        designation_id: respondent_designation?.id,
                        tenant_id: this.requestParams.tenant.id,
                      },
                      transaction,
                    });
                  alreadyFoundedUsers[respondent.email] = newRespondent;
                }

                let newRespondent = alreadyFoundedUsers[respondent.email];
                number_of_respondents++;

                respondents.push({
                  status: SurveyRespondantStatus.Ongoing,
                  survey_id: survey.id,
                  respondant_id: newRespondent.id,
                  relationship_with_employee_id:
                    Allcategories[category.category_name],
                  is_selected_by_system: false,
                  is_approved_by_employee: true,
                  is_approved_by_line_manager: true,
                });
              }
            }
          } else {
            for (const respondant of category.respondents) {
              if (respondant.email) {
                if (!alreadyFoundedUsers[respondant.email]) {
                  // find or create user from db
                  const newRespondent = await this.user
                    .schema(this.requestParams.schema_name)
                    .findOne({
                      where: {
                        email: respondant.email,
                      },
                    });
                  if (newRespondent) {
                    throw new BadRequestException(
                      `Users of this tenant can not be used as external respondent in survey, check user with (${respondant.email}) as email`
                    );
                  }
                } else {
                  throw new BadRequestException(
                    `Users of this tenant can not be used as external respondent in survey, check user with (${respondant.email}) as email`
                  );
                }
                externalRespondents.push({
                  status: SurveyRespondantStatus.Ongoing,
                  survey_id: survey.id,
                  respondant_email: respondant.email,
                  respondant_name: respondant.name,
                  relationship_with_employee_id:
                    Allcategories[category.category_name],
                  // relationship_with_employee_id: category.category_id,
                  is_approved_by_employee: true,
                  is_approved_by_line_manager: true,
                });
                number_of_respondents++;
              }
            }
          }
        }

        surveys.push({
          ...JSON.parse(JSON.stringify(survey)),
          no_of_respondents: number_of_respondents + 1,
        });
      }

      await this.survey
        .schema(this.requestParams.schema_name)
        .bulkCreate(surveys, { transaction });
      await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .bulkCreate(respondents, { transaction });
      await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .bulkCreate(externalRespondents, {
          transaction,
        });

      await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).create(
        {
          type: TenantHistoryTypes.ongoing_survey,
          reference_id: surveyDescription.id,
          tenant_id: this.requestParams.tenant.id,
          group: TenantHistoryGroup.survey,
        },
        { transaction }
      );

      let respondants = await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .findAll({
          include: [
            {
              attributes: ["id"],
              model: Survey,
              where: {
                survey_id: surveyDescription.id,
              },
            },
            {
              model: User,
              attributes: ["name", "email", "id"],
            },
          ],
          transaction,
        });

      let externalRespondants = await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .unscoped()
        .findAll({
          include: [
            {
              attributes: ["id"],
              model: Survey,
              where: {
                survey_id: surveyDescription.id,
              },
            },
          ],
          transaction,
        });

      let allCommentResponses = [];
      for (let resp of respondants) {
        allCommentResponses.push(
          ...[
            {
              survey_id: resp.survey.id,
              response_text: "",
              question_type: "strength",
              survey_respondent_id: resp.id,
              survey_external_respondent_id: null,
              category_id: resp.relationship_with_employee_id,
            },
            {
              survey_id: resp.survey.id,
              response_text: "",
              question_type: "weakness",
              survey_respondent_id: resp.id,
              survey_external_respondent_id: null,
              category_id: resp.relationship_with_employee_id,
            },
          ]
        );
      }
      for (let resp of externalRespondants) {
        allCommentResponses.push(
          ...[
            {
              survey_id: resp.survey.id,
              response_text: "",
              question_type: "strength",
              survey_respondent_id: null,
              survey_external_respondent_id: resp.id,
              category_id: resp.relationship_with_employee_id,
            },
            {
              survey_id: resp.survey.id,
              response_text: "",
              question_type: "weakness",
              survey_respondent_id: null,
              survey_external_respondent_id: resp.id,
              category_id: resp.relationship_with_employee_id,
            },
          ]
        );
      }

      await this.commentResponse
        .schema(this.requestParams.schema_name)
        .bulkCreate(allCommentResponses, {
          transaction,
        });

      await transaction.commit();

      departments = null;
      department = null;
      designations = null;
      designation = null;
      employees = null;
      surveys = null;
      respondents = null;
      Allcategories = null;
      externalRespondents = null;
      alreadyFoundedUsers = null;

      const maxLength = Math.max(
        respondants.length,
        externalRespondants.length
      );
      let alreadySent = [];
      let alreadySentExternal = [];
      let tokens = [];

      // for (const item of body.commentResponses) {
      //   allCommentResponses.push({
      //     ...item,
      //   });
      // }

      for (let index = 0; index < maxLength; index++) {
        if (
          respondants[index] &&
          !alreadySent.includes(respondants[index].respondant.email)
        ) {
          const token = await this.jwtService.signAsync({
            id: respondants[index].respondant.id,
            survey_respondant_id: respondants[index].id,
            survey_id: surveyDescription.id,
            schema_name: this.requestParams.tenant.schema_name,
            is_external: false,
          });
          if (tokens) {
            tokens.push(token);
          }

          let Mail = {
            to: respondants[index].respondant.email,
            subject: `Invitation to fill feedback survey | ${surveyDescription.title}`,
            context: {
              link: `${this.config.get(
                "FE_URL"
              )}/survey/assessment/instructions/${token}`,
              username: respondants[index].respondant.name,
              logo: "cid:company-logo",
              surveyTitle: surveyDescription.title,
              tenantName: this.requestParams.tenant.name,
              endDate: moment(surveyDescription.end_date).format("DD/MM/YY"),
              ...defaultContext,
            },
            attachments: [
              {
                filename: "nbol-email-logo",
                path: "src/public/media/images/nbol-email-logo.png",
                cid: "company-logo",
              },
              ...defaultAttachments,
            ],
          };

          this.mailsService.SurveyMail(Mail);
          alreadySent.push(respondants[index].respondant.email);
        }
        if (
          externalRespondants[index] &&
          !alreadySentExternal.includes(
            externalRespondants[index].respondant_email
          )
        ) {
          const token = await this.jwtService.signAsync({
            email: externalRespondants[index].respondant_email,
            schema_name: this.requestParams.tenant.schema_name,
            is_external: true,
            survey_id: surveyDescription.id,
          });

          if (tokens) {
            tokens.push(token);
          }

          let Mail = {
            to: externalRespondants[index].respondant_email,
            subject: `Invitation to fill feedback survey | ${surveyDescription.title}`,
            context: {
              link: `${this.config.get(
                "FE_URL"
              )}/survey/assessment/instructions/${token}`,
              username: externalRespondants[index].respondant_name,
              logo: "cid:company-logo",
              surveyTitle: surveyDescription.title,
              tenantName: this.requestParams.tenant.name,
              endDate: moment(surveyDescription.end_date).format("DD/MM/YY"),
              ...defaultContext,
            },
            attachments: [
              {
                filename: "nbol-email-logo",
                path: "src/public/media/images/nbol-email-logo.png",
                cid: "company-logo",
              },
              ...defaultAttachments,
            ],
          };

          this.mailsService.SurveyMail(Mail);
          alreadySentExternal.push(externalRespondants[index].respondant_email);
        }
      }

      respondants = null;
      externalRespondants = null;
      alreadySent = null;
      alreadySentExternal = null;
      tokens = null;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /////////////////////////////////
  async addRatee(data: ExcelSurveyRespondentsDTO[], survey_id: any) {
    const transaction = await this.sequelize.transaction();
    const selfRater = await this.rater
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          name: "Self",
          survey_description_id: survey_id.id,
        },
      });
    let departments = {};
    let department;
    let designations = {};
    let designation;
    let employees = [];
    let surveys = [];
    let respondents = [];
    let Allcategories = {};
    let externalRespondents = [];
    let alreadyFoundedUsers = {};

    try {
      this.usersRepeatCheck(data, true);
      const surveyDescription = await this.surveyDescription
        .schema(this.requestParams.schema_name)
        .findOne({
          where: {
            id: survey_id.id,
          },
        });
      // const raters = await this.rater
      //   .schema(this.requestParams.schema_name)
      //   .findAll({
      //     where: {
      //       survey_description_id: survey_id.id,
      //       // id: data[0] ? data[0].categories.map((item) => item.category_id) : [],
      //     },
      //   });

      // let selfRater;
      // const bulkBuildRaters = this.rater
      //   .schema(this.requestParams.schema_name)
      //   .bulkBuild(
      //     raters.map((rater) => {
      //       return {
      //         name: rater.name,
      //         category_name: rater.category_name,
      //         short_name: rater.short_name,
      //         can_be_deleted: rater.can_be_deleted,
      //         is_external: rater.is_external,
      //         order: rater.order,
      //         // is_required: rater.is_required,
      //         no_of_raters: rater.no_of_raters,
      //         survey_description_id: surveyDescription.id,
      //       };
      //     })
      //   );
      // await this.rater.schema(this.requestParams.schema_name).bulkCreate(
      //   bulkBuildRaters.map((item) => item["dataValues"]),
      //   { transaction }
      // );

      // bulkBuildRaters.forEach((item) => {
      //   if (item["dataValues"].name === "Self") {
      //     selfRater = JSON.parse(JSON.stringify(item["dataValues"]));
      //   }
      //   Allcategories[item["dataValues"].category_name] = item["dataValues"].id;
      // });

      // if (!selfRater) {
      //   selfRater = await this.rater
      //     .schema(this.requestParams.schema_name)
      //     .findOne({
      //       where: {
      //         name: "Self",
      //         survey_description_id: null,
      //       },
      //       attributes: ["id"],
      //     });
      // }

      for await (const user of data) {
        // check if current user has any conflict
        if (user.status === Status.improper_incomplete_data) {
          throw new BadRequestException(
            "All Recipients status should be No Conflicts"
          );
        }
        if (user.ratee_department) {
          // check if department is already in departments or not if not in departments then create
          if (!departments[user.ratee_department]) {
            let newDepartment = await this.department
              .schema(this.requestParams.schema_name)
              .findOrCreate({
                where: { name: user.ratee_department },
                defaults: {
                  name: user.ratee_department,
                },
                transaction,
              });
            departments[user.ratee_department] = newDepartment[0];
          }
          department = departments[user.ratee_department];
        }
        if (user.ratee_designation) {
          // check if designation is already in designations or not if not in designations then create
          if (!designations[user.ratee_designation]) {
            let newDesignation = await this.designation
              .schema(this.requestParams.schema_name)
              .findOrCreate({
                where: { name: user.ratee_designation },
                defaults: {
                  name: user.ratee_designation,
                },
                transaction,
              });
            designations[user.ratee_designation] = newDesignation[0];
          }
          designation = designations[user.ratee_designation];
        }

        // check if this user is already there in already founded users object if not then finr or create then set in alreadyFoundedUsers
        if (!alreadyFoundedUsers[user.ratee_email]) {
          const isTenantuser = await this.tenantUser
            .schema(DB_PUBLIC_SCHEMA)
            .findOne({
              where: { email: user.ratee_email },
              include: [{ model: Tenant }],
            });

          if (isTenantuser) {
            if (isTenantuser.my_tenant.is_channel_partner) {
              throw new BadRequestException(
                `This  User (${user.ratee_email}) already exists in Tenant!`
              );
            }

            if (
              isTenantuser.my_tenant.schema_name !==
              this.requestParams.schema_name
            ) {
              const isUserInTenant = await User.schema(
                isTenantuser.my_tenant.schema_name
              ).findOne({
                where: { email: user.ratee_email },
              });
              if (isUserInTenant)
                throw new BadRequestException(
                  `This  User (${user.ratee_email}) already exists in Tenant!`
                );
            }
          }
          // find or create user from db
          const [newUser] = await this.user
            .schema(this.requestParams.schema_name)
            .findOrCreate({
              where: {
                email: user.ratee_email,
              },
              defaults: {
                name: user.ratee_name,
                email: user.ratee_email,
                contact: user.ratee_contact,
                employee_code: user.employee_code,
                department_id: user.ratee_department ? department?.id : null,
                designation_id: user.ratee_designation ? designation?.id : null,
                tenant_id: this.requestParams.tenant.id,
              },
              transaction,
            });

          alreadyFoundedUsers[user.ratee_email] = newUser;
        }
        const newUserCheck = await this.survey
          .schema(this.requestParams.schema_name)
          .findAll({
            where: {
              survey_id: survey_id.id,
            },
            include: [
              {
                model: User,
                where: {
                  email: user.ratee_email,
                },
              },
            ],
          });
        if (newUserCheck.length > 0) {
          throw new BadRequestException(
            `Survey with ${user.ratee_email} email already exists`
          );
        }
        let newUser = alreadyFoundedUsers[user.ratee_email];
        employees.push(newUser.id);

        let survey = this.survey.build({
          survey_id: surveyDescription.id,
          employee_id: newUser.id,
          status: SurveyStatus.Ongoing,
        });

        respondents.push({
          survey_id: survey.id,
          respondant_id: newUser.id,
          relationship_with_employee_id: selfRater.id,
          is_selected_by_system: true,
          is_approved_by_employee: true,
          is_approved_by_line_manager: true,
          status: SurveyRespondantStatus.Ongoing,
        });
        let number_of_respondents = 0;

        for (const category of user.categories) {
          if (!category.is_external) {
            for (const respondent of category.respondents) {
              let respondent_designation;
              if (respondent.designation) {
                // check if designation is already in designations or not if not in designations then create
                if (!designations[respondent.designation]) {
                  let newDesignation = await this.designation
                    .schema(this.requestParams.schema_name)
                    .findOrCreate({
                      where: { name: respondent.designation },
                      defaults: {
                        name: respondent.designation,
                      },
                      transaction,
                    });
                  designations[respondent.designation] = newDesignation[0];
                }
                respondent_designation = designations[respondent.designation];
              }
              if (respondent.email) {
                // check if this user is already there in already founded users object if not then finr or create then set in alreadyFoundedUsers
                if (!alreadyFoundedUsers[respondent.email]) {
                  const isTenantuser = await this.tenantUser
                    .schema(DB_PUBLIC_SCHEMA)
                    .findOne({
                      where: { email: respondent.email },
                      include: [{ model: Tenant.schema(DB_PUBLIC_SCHEMA) }],
                    });

                  if (isTenantuser) {
                    if (isTenantuser.my_tenant.is_channel_partner) {
                      throw new BadRequestException(
                        `User with this (${respondent.email}) email already exists!`
                      );
                    }
                    if (
                      isTenantuser.my_tenant.schema_name !==
                      this.requestParams.schema_name
                    ) {
                      const isUserInTenant = await User.schema(
                        isTenantuser.my_tenant.schema_name
                      ).findOne({
                        where: { email: user.ratee_email },
                      });
                      if (isUserInTenant)
                        throw new BadRequestException(
                          `User with this (${user.ratee_email}) email already exists!`
                        );
                    }
                  }
                  // find or create user from db
                  const [newRespondent] = await this.user
                    .schema(this.requestParams.schema_name)
                    .findOrCreate({
                      where: {
                        email: respondent.email,
                      },
                      defaults: {
                        name: respondent.name,
                        email: respondent.email,
                        employee_code: respondent.employee_code,
                        designation_id: respondent_designation?.id,
                        tenant_id: this.requestParams.tenant.id,
                      },
                      transaction,
                    });
                  alreadyFoundedUsers[respondent.email] = newRespondent;
                }

                let newRespondent = alreadyFoundedUsers[respondent.email];
                number_of_respondents++;

                respondents.push({
                  status: SurveyRespondantStatus.Ongoing,
                  survey_id: survey.id,
                  respondant_id: newRespondent.id,
                  relationship_with_employee_id: category.id,
                  is_selected_by_system: false,
                  is_approved_by_employee: true,
                  is_approved_by_line_manager: true,
                });
              }
            }
          } else {
            for (const respondant of category.respondents) {
              if (respondant.email) {
                if (!alreadyFoundedUsers[respondant.email]) {
                  // find or create user from db
                  const newRespondent = await this.user
                    .schema(this.requestParams.schema_name)
                    .findOne({
                      where: {
                        email: respondant.email,
                      },
                    });
                  if (newRespondent) {
                    throw new BadRequestException(
                      `Users of this tenant can not be used as external respondent in survey, check user with (${respondant.email}) as email`
                    );
                  }
                } else {
                  throw new BadRequestException(
                    `Users of this tenant can not be used as external respondent in survey, check user with (${respondant.email}) as email`
                  );
                }
                externalRespondents.push({
                  status: SurveyRespondantStatus.Ongoing,
                  survey_id: survey.id,
                  respondant_email: respondant.email,
                  respondant_name: respondant.name,
                  relationship_with_employee_id: category.id,
                  // relationship_with_employee_id: category.category_id,
                  is_approved_by_employee: true,
                  is_approved_by_line_manager: true,
                });
                number_of_respondents++;
              }
            }
          }
        }

        surveys.push({
          ...JSON.parse(JSON.stringify(survey["dataValues"])),
          no_of_respondents: number_of_respondents + 1,
        });
      }

      await this.survey
        .schema(this.requestParams.schema_name)
        .bulkCreate(surveys, { transaction });
      await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .bulkCreate(respondents, { transaction });
      await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .bulkCreate(externalRespondents, {
          transaction,
        });
      await this.surveyDescription
        .schema(this.requestParams.schema_name)
        .update(
          {
            assessments_due: Sequelize.literal(
              `"assessments_due" + ${surveys.length}`
            ),
            total_assessments: Sequelize.literal(
              `"total_assessments" + ${surveys.length}`
            ),
          },
          {
            where: {
              id: survey_id.id,
            },
          }
        );

      await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).create(
        {
          type: TenantHistoryTypes.ongoing_survey,
          reference_id: surveyDescription.id,
          tenant_id: this.requestParams.tenant.id,
          group: TenantHistoryGroup.survey,
        },
        { transaction }
      );

      await transaction.commit();
      for (const item of surveys) {
        const respondants = await this.surveyRespondant
          .schema(this.requestParams.schema_name)
          .findAll({
            include: [
              {
                attributes: [],
                model: Survey,
                where: {
                  id: item.id,
                },
              },
              {
                model: User,
                attributes: ["name", "email", "id"],
              },
            ],
          });
        const externalRespondants = await this.surveyExternalRespondant
          .schema(this.requestParams.schema_name)
          .unscoped()
          .findAll({
            include: [
              {
                attributes: [],
                model: Survey,
                where: {
                  id: item.id,
                },
              },
            ],
          });
        const maxLength = Math.max(
          respondants.length,
          externalRespondants.length
        );
        let alreadySent = [];
        let alreadySentExternal = [];
        let tokens = [];
        for (let index = 0; index < maxLength; index++) {
          if (
            respondants[index] &&
            !alreadySent.includes(respondants[index].respondant.email)
          ) {
            const token = await this.jwtService.signAsync({
              id: respondants[index].respondant.id,
              survey_id: surveyDescription.id,
              schema_name: this.requestParams.tenant.schema_name,
              is_external: false,
            });
            if (tokens) {
              tokens.push(token);
            }

            let Mail = {
              to: respondants[index].respondant.email,
              subject: `Invitation to fill feedback survey | ${surveyDescription.title}`,
              context: {
                link: `${this.config.get(
                  "FE_URL"
                )}/survey/assessment/instructions/${token}`,
                username: respondants[index].respondant.name,
                logo: "cid:company-logo",
                surveyTitle: surveyDescription.title,
                tenantName: this.requestParams.tenant.name,
                endDate: moment(surveyDescription.end_date).format("DD/MM/YY"),
                ...defaultContext,
              },
              attachments: [
                {
                  filename: "nbol-email-logo",
                  path: "src/public/media/images/nbol-email-logo.png",
                  cid: "company-logo",
                },
                ...defaultAttachments,
              ],
            };

            this.mailsService.SurveyMail(Mail);
            alreadySent.push(respondants[index].respondant.email);
          }
          if (
            externalRespondants[index] &&
            !alreadySentExternal.includes(
              externalRespondants[index].respondant_email
            )
          ) {
            const token = await this.jwtService.signAsync({
              email: externalRespondants[index].respondant_email,
              schema_name: this.requestParams.tenant.schema_name,
              is_external: true,
              survey_id: surveyDescription.id,
            });

            if (tokens) {
              tokens.push(token);
            }

            let Mail = {
              to: externalRespondants[index].respondant_email,
              subject: `Invitation to fill feedback survey | ${surveyDescription.title}`,
              context: {
                link: `${this.config.get(
                  "FE_URL"
                )}/survey/assessment/instructions/${token}`,
                username: externalRespondants[index].respondant_name,
                logo: "cid:company-logo",
                surveyTitle: surveyDescription.title,
                tenantName: this.requestParams.tenant.name,
                endDate: moment(surveyDescription.end_date).format("DD/MM/YY"),
                ...defaultContext,
              },
              attachments: [
                {
                  filename: "nbol-email-logo",
                  path: "src/public/media/images/nbol-email-logo.png",
                  cid: "company-logo",
                },
                ...defaultAttachments,
              ],
            };

            this.mailsService.SurveyMail(Mail);
            alreadySentExternal.push(
              externalRespondants[index].respondant_email
            );
          }
        }
      }
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  /////////////////////////////////
  async getFullDetailOfSurveyForSingleRatee(body: SubmitSurveySingleRateeDTO) {
    let surveyRespondant;

    if (body.is_external) {
      surveyRespondant = await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .findOne({
          where: { id: body?.respondant_id },
          include: [{ model: Rater, attributes: ["id", "category_name"] }],
        });
    } else {
      surveyRespondant = await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .findOne({
          where: { id: body?.respondant_id },
          include: [{ model: Rater, attributes: ["id", "category_name"] }],
        });
    }

    if (surveyRespondant?.status !== SurveyStatus.Ongoing) {
      return { user: null, survey: null };
    }

    const survey = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .unscoped()
      .findOne({
        attributes: [
          "id",
          "title",
          "description",
          "end_date",
          "status",
          "questionnaire_id",
          "createdAt",
        ],
        order: [
          // [
          //   {
          //     model: Questionnaire,
          //     as: "questionnaire",
          //   },
          //   {
          //     model: Question,
          //     as: "questions",
          //   },
          //   {
          //     model: Competency,
          //     as: "competency",
          //   },
          //   "title",
          //   "ASC",
          // ],
          // [
          //   {
          //     model: Questionnaire,
          //     as: "questionnaire",
          //   },
          //   {
          //     model: Question,
          //     as: "questions",
          //   },
          //   "createdAt",
          //   "DESC",
          // ],
          // [
          //   {
          //     model: Questionnaire,
          //     as: "questionnaire",
          //   },
          //   {
          //     model: Question,
          //     as: "questions",
          //   },
          //   "order",
          //   "ASC",
          // ],
          // [
          //   {
          //     model: Questionnaire,
          //     as: "questionnaire",
          //   },
          //   {
          //     model: Question,
          //     as: "questions",
          //   },
          //   {
          //     model: QuestionResponse,
          //     as: "responses",
          //   },
          //   "score",
          //   "ASC",
          // ],
          [
            {
              model: Questionnaire,
              as: "questionnaire",
            },
            {
              model: Question,
              as: "questions",
            },
            {
              model: Competency,
              as: "competency",
            },
            {
              model: QuestionnaireCompetency,
              as: "questionnaireCompetencies",
            },
            "order",
            "ASC",
          ],
          [
            {
              model: Questionnaire,
              as: "questionnaire",
            },
            {
              model: Question,
              as: "questions",
            },
            {
              model: QuestionnaireQuestion,
              as: "questionnaireQuestion",
            },
            "order",
            "ASC",
          ],
          [
            {
              model: Questionnaire,
              as: "questionnaire",
            },
            {
              model: Question,
              as: "questions",
            },
            {
              model: QuestionResponse,
              as: "responses",
            },
            "order",
            "DESC",
          ],
        ],
        include: [
          {
            model: Survey,
            where: {
              id: surveyRespondant?.survey_id,
              status: SurveyStatus.Ongoing,
            },
            attributes: ["id", "status", "survey_id"],
          },
          {
            model: Questionnaire,
            attributes: ["id", "title", "description", "no_of_questions"],
            required: false,
            where: { is_copy: true },
            include: [
              {
                attributes: ["id", "text", "response_type", "regional_text"],
                model: Question,
                required: false,
                through: { attributes: [] },
                where: { is_copy: true },
                include: [
                  {
                    model: QuestionnaireQuestion.unscoped(),
                    attributes: ["order"],
                  },
                  {
                    model: Competency,
                    attributes: [
                      "id",
                      "title",
                      "description",
                      "no_of_questions",
                      "type",
                    ],
                    required: false,
                    where: { is_copy: true },
                    include: [
                      {
                        model: QuestionnaireCompetency.unscoped(),
                        attributes: ["order"],
                      },
                    ],
                    // include: [
                    //   {
                    //     model: CompetencyComment,
                    //     required: false,
                    //     where: {
                    //       [Op.or]: [
                    //         {
                    //           survey_respondent_id: surveyRespondant.id,
                    //         },
                    //         {
                    //           survey_external_respondent_id:
                    //             surveyRespondant.id,
                    //         },
                    //       ],
                    //     },
                    //   },
                    // ],
                  },
                  {
                    model: QuestionResponse,
                    required: false,
                    attributes: [
                      "score",
                      ["id", "value"],
                      "type",
                      [
                        literal(`concat("questionnaire->questions->responses"."label", (case
                        when "questionnaire->questions->responses"."type" = 'likert_scale' then concat(' (', "questionnaire->questions->responses"."score", ')')
                        else ''
                        end))`),
                        "label",
                      ],
                    ],
                    where: { is_copy: true },
                  },
                  {
                    model: SurveyResponse,
                    required: false,
                    as: "expectedSurveyResponses",
                    where: {
                      [Op.or]: {
                        survey_respondant_id: surveyRespondant.id,
                        survey_external_respondant_id: surveyRespondant.id,
                      },
                    },
                  },
                  {
                    model: SurveyResponse,
                    as: "surveyResponses",
                    required: false,
                    where: {
                      [Op.or]: {
                        survey_respondant_id: surveyRespondant.id,
                        survey_external_respondant_id: surveyRespondant.id,
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      });

    const user = await this.user
      .schema(this.requestParams.schema_name)
      .findOne({
        attributes: ["name", "email", "createdAt"],
        subQuery: false,
        include: [
          {
            model: Survey,
            where: { id: surveyRespondant.survey_id },
            attributes: ["id", "status"],
          },
          {
            model: Department,
            attributes: ["name"],
          },
          {
            model: Designation,
            attributes: ["name"],
          },
        ],
      });

    const commentResponses = await this.commentResponse
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          [Op.or]: [
            {
              survey_respondent_id: surveyRespondant.id,
            },
            {
              survey_external_respondent_id: surveyRespondant.id,
            },
          ],
        },
      });

    let finalUser = {
      ...JSON.parse(JSON.stringify(user)),
      rater: surveyRespondant?.rater,
    };

    return { survey, user: finalUser, commentResponses };
  }
  ////////////////////////////
  async submitSurveyForSingleRatee(body: SubmitSingleSurveyDTO) {
    const transaction = await this.sequelize.transaction();
    try {
      let surveyRespondant;

      if (body.is_external) {
        surveyRespondant = await this.surveyExternalRespondant
          .schema(this.requestParams.schema_name)
          .findOne({
            where: { id: body.respondant_id },
          });
      } else {
        surveyRespondant = await this.surveyRespondant
          .schema(this.requestParams.schema_name)
          .findOne({
            where: { id: body.respondant_id },
            include: [
              {
                model: User,
              },
            ],
          });
      }

      const survey = await this.survey
        .schema(this.requestParams.schema_name)
        .findOne({
          where: {
            id: surveyRespondant.survey_id,
          },
          include: [
            { model: User, attributes: ["name", "email"] },
            {
              model: SurveyDescription,
            },
          ],
        });

      if (!survey || survey.status !== SurveyStatus.Ongoing)
        throw new NotFoundException("Survey Not Found");

      let data = [];

      for (const item of body.surveyResponses) {
        if (item.question_type === QuestionResponseOptions.multiple_choice) {
          for (const resp of item.response_ids) {
            data.push({
              survey_id: survey.id,
              survey_respondant_id: body.is_external
                ? null
                : surveyRespondant.id,
              question_id: item.question_id,
              response_text: item.response_text,
              response_id: resp,
              survey_external_respondant_id: body.is_external
                ? surveyRespondant.id
                : null,
              consider_in_report: item.consider_in_report,
              category_id: surveyRespondant?.relationship_with_employee_id,
            });
          }
        } else {
          data.push({
            survey_id: survey.id,
            survey_respondant_id: body.is_external ? null : surveyRespondant.id,
            question_id: item.question_id,
            response_text: item.response_text,
            response_id:
              item.question_type === QuestionResponseOptions.text
                ? null
                : item.response_id,
            survey_external_respondant_id: body.is_external
              ? surveyRespondant.id
              : null,
            consider_in_report: item.consider_in_report,
            category_id: surveyRespondant?.relationship_with_employee_id,
            gap:
              item.question_type === QuestionResponseOptions.likert_scale
                ? item.gap < 0
                  ? 0
                  : item.gap
                : null,
            actual_gap:
              item.question_type === QuestionResponseOptions.likert_scale
                ? item.gap
                : null,
            expected_response_id: item.expected_response_id
              ? item.expected_response_id
              : null,
          });
        }
      }

      const destroyWhere = body.is_external
        ? { survey_external_respondant_id: surveyRespondant.id }
        : { survey_respondant_id: surveyRespondant.id };

      // const competencyComments: any = Object.entries(
      //   body.competencyComments
      // ).map(([key, value]) => ({
      //   competency_id: key,
      //   comments: value,
      //   survey_id: survey.id,
      //   survey_respondent_id: body.is_external
      //     ? undefined
      //     : surveyRespondant.id,
      //   survey_external_respondent_id: body.is_external
      //     ? surveyRespondant.id
      //     : undefined,
      // }));

      let allCommentResponses = [];
      for (const item of body.commentResponses) {
        allCommentResponses.push({
          ...item,
          survey_id: survey.id,
          category_id: surveyRespondant?.relationship_with_employee_id,
          survey_respondent_id: body.is_external
            ? undefined
            : surveyRespondant.id,
          survey_external_respondent_id: body.is_external
            ? surveyRespondant.id
            : undefined,
        });
      }

      await this.surveyResponse
        .schema(this.requestParams.schema_name)
        .destroy({ where: destroyWhere, transaction });
      await this.surveyResponse
        .schema(this.requestParams.schema_name)
        .bulkCreate(data, { transaction });
      // await this.competencyComment
      //   .schema(this.requestParams.schema_name)
      //   .destroy({
      //     where: {
      //       [Op.or]: [
      //         { survey_respondent_id: surveyRespondant.id },
      //         { survey_external_respondent_id: surveyRespondant.id },
      //       ],
      //     },
      //     transaction,
      //   });
      // await this.competencyComment
      //   .schema(this.requestParams.schema_name)
      //   .bulkCreate([...competencyComments], {
      //     transaction,
      //   });

      await this.commentResponse
        .schema(this.requestParams.schema_name)
        .destroy({
          where: {
            [Op.or]: [
              { survey_respondent_id: surveyRespondant.id },
              { survey_external_respondent_id: surveyRespondant.id },
            ],
          },
          transaction,
        });
      await this.commentResponse
        .schema(this.requestParams.schema_name)
        .bulkCreate([...allCommentResponses], {
          transaction,
        });

      const token = {
        email: surveyRespondant.respondant_email
          ? surveyRespondant.respondant_email
          : surveyRespondant.respondant.email,
        schema_name: this.requestParams.schema_name,
        is_external: body?.is_external,
        survey_id: survey?.survey_description?.id,
      };
      this.afterSurveySubmitionProcessIndividual(
        { status: body?.status },
        surveyRespondant.id,
        surveyRespondant.survey_id,
        token
        // tenant
      );
      await transaction.commit();
      return "Survey submited successfully";
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  ////////////////////////////
  async allDraftSurveys() {
    return await this.draftSurvey
      .schema(this.requestParams.schema_name)
      .findAll({ ...this.requestParams.pagination });
  }

  async oneDraftSurveys(id: string) {
    return await this.draftSurvey
      .schema(this.requestParams.schema_name)
      .findOne({ where: { id } });
  }

  async submitSurvey(body: SubmitSurveyDTO) {
    let transaction = await this.sequelize.transaction();
    try {
      let token: any = body.token;

      let respondants = [];

      let surveyIds = [];

      let data = [];

      if (body.surveyResponses) {
        for (const survey of body.surveyResponses) {
          if (!survey.is_comment_response) {
            surveyIds.push(survey.survey_id);

            for (const response of survey.responses) {
              if (
                response.question_type ===
                QuestionResponseOptions.multiple_choice
              ) {
                for (const resp of response.response_ids) {
                  data.push({
                    ...response,

                    response_id: resp,

                    survey_respondant_id: token.is_external
                      ? null
                      : response.survey_respondant_id,

                    survey_external_respondant_id: token.is_external
                      ? response.survey_external_respondant_id
                      : null,

                    expected_response_id: null,
                  });
                }
              } else {
                if (response.response_id) {
                  data.push({
                    ...response,

                    survey_respondant_id: token.is_external
                      ? null
                      : response.survey_respondant_id,

                    survey_external_respondant_id: token.is_external
                      ? response.survey_external_respondant_id
                      : null,

                    response_id: response.response_id,

                    gap:
                      response.question_type ===
                      QuestionResponseOptions.likert_scale
                        ? response.gap < 0
                          ? 0
                          : response.gap
                        : null,

                    actual_gap:
                      response.question_type ===
                      QuestionResponseOptions.likert_scale
                        ? response.gap
                        : null,

                    expected_response_id: response.expected_response_id
                      ? response.expected_response_id
                      : null,
                  });
                }
              }
            }

            respondants.push(
              token.is_external
                ? survey.survey_external_respondant_id
                : survey.respondent_id
            );
          }
        }
      }

      if (body.fillForm) {
        let destroyWhere = token.is_external
          ? {
              survey_external_respondant_id: respondants,
            }
          : { survey_respondant_id: respondants };

        await this.surveyResponse

          .schema(token.schema_name)

          .destroy({ where: destroyWhere, transaction });

        await this.surveyResponse

          .schema(token.schema_name)

          .bulkCreate(data, { transaction });

        destroyWhere = null;
      }

      await this.commentResponse.schema(token.schema_name).destroy({
        where: {
          [Op.or]: [
            {
              survey_respondent_id: [
                ...new Set(
                  body.commentResponses.map((item) => item.survey_respondent_id)
                ),
              ] as string[],
            },

            {
              survey_external_respondent_id: [
                ...new Set(
                  body.commentResponses.map(
                    (item) => item.survey_external_respondent_id
                  )
                ),
              ] as string[],
            },
          ],
        },
      });

      let allCommentResponses = [];
      for (const item of body.commentResponses) {
        allCommentResponses.push({
          ...item,
        });
      }

      await this.commentResponse

        .schema(token.schema_name)

        .bulkCreate(allCommentResponses, {
          transaction,
        });

      // await this.competencyComment.schema(token.schema_name).destroy({

      //   where: {

      //     [Op.or]: [

      //       {

      //         survey_respondent_id: [

      //           ...new Set(

      //             body.competencyComments.map(

      //               (item) => item.survey_respondent_id

      //             )

      //           ),

      //         ] as string[],

      //       },

      //       {

      //         survey_external_respondent_id: [

      //           ...new Set(

      //             body.competencyComments.map(

      //               (item) => item.survey_external_respondent_id

      //             )

      //           ),

      //         ] as string[],

      //       },

      //     ],

      //   },

      // });

      // await this.competencyComment

      //   .schema(token.schema_name)

      //   .bulkCreate(body.competencyComments, {

      //     transaction,

      //   });

      // await transaction.commit();

      // await this.surveyQueue.add(SURVEY_AFTER_SUBMITION_PROCESS, {

      //   body,

      //   respondants,

      //   token,

      // });

      await transaction.commit();

      this.afterSurveySubmitionProcess(
        { status: body.status },

        JSON.parse(JSON.stringify(respondants)),

        JSON.parse(JSON.stringify(token))
      );

      surveyIds = null;

      data = null;

      transaction = null;

      return "Survey submited successfully";
    } catch (error) {
      await transaction.rollback();

      transaction = null;

      throw error;
    }
  }
  async submitSurveyQuestion(body: SurveyRespondentDTO) {
    const transaction = await this.sequelize.transaction();
    try {
      const token: any = body.token;

      if (!body.is_comment_response) {
        let data = [];
        let respondants = [];

        for (const response of body.responses) {
          respondants.push(
            token.is_external
              ? response.survey_external_respondant_id
              : response.survey_respondant_id
          );
          if (
            response.question_type === QuestionResponseOptions.multiple_choice
          ) {
            for (const resp of response.response_ids) {
              data.push({
                ...response,
                response_id: resp,
                survey_respondant_id: token.is_external
                  ? null
                  : response.survey_respondant_id,
                survey_external_respondant_id: token.is_external
                  ? response.survey_external_respondant_id
                  : null,
                expected_response_id: null,
              });
            }
          } else {
            if (response.response_id) {
              data.push({
                ...response,
                survey_respondant_id: token.is_external
                  ? null
                  : response.survey_respondant_id,
                survey_external_respondant_id: token.is_external
                  ? response.survey_external_respondant_id
                  : null,
                response_id: response.response_id,
                gap:
                  response.question_type ===
                  QuestionResponseOptions.likert_scale
                    ? response.gap < 0
                      ? 0
                      : response.gap
                    : null,
                actual_gap:
                  response.question_type ===
                  QuestionResponseOptions.likert_scale
                    ? response.gap
                    : null,
                expected_response_id: response.expected_response_id
                  ? response.expected_response_id
                  : null,
              });
            }
          }
        }

        const destroyWhere = token.is_external
          ? {
              survey_external_respondant_id: respondants,
              question_id: body.question_id,
            }
          : {
              survey_respondant_id: respondants,
              question_id: body.question_id,
            };

        await this.surveyResponse
          .schema(token.schema_name)
          .destroy({ where: destroyWhere, transaction });
        await this.surveyResponse
          .schema(token.schema_name)
          .bulkCreate(data, { transaction });
      } else {
        //   await this.competencyComment.schema(token.schema_name).destroy({
        //     where: {
        //       [Op.or]: [
        //         {
        //           survey_respondent_id: [
        //             ...new Set(
        //               body.competencyComments.map(
        //                 (item) => item.survey_respondent_id
        //               )
        //             ),
        //           ] as string[],
        //         },
        //         {
        //           survey_external_respondent_id: [
        //             ...new Set(
        //               body.competencyComments.map(
        //                 (item) => item.survey_external_respondent_id
        //               )
        //             ),
        //           ] as string[],
        //         },
        //       ],
        //     },
        //   });
        //   await this.competencyComment
        //     .schema(token.schema_name)
        //     .bulkCreate(body.competencyComments, {
        //       transaction,
        //     });

        let allCommentResponses = [];
        for (const item of body.commentResponses) {
          allCommentResponses.push({
            ...item,
          });
        }

        await this.commentResponse.schema(token.schema_name).destroy({
          where: {
            [Op.or]: [
              {
                survey_respondent_id: [
                  ...new Set(
                    body.commentResponses.map(
                      (item) => item.survey_respondent_id
                    )
                  ),
                ] as string[],
              },
              {
                survey_external_respondent_id: [
                  ...new Set(
                    body.commentResponses.map(
                      (item) => item.survey_external_respondent_id
                    )
                  ),
                ] as string[],
              },
            ],
            question_type: body.commentResponses[0]?.question_type,
          },
        });

        await this.commentResponse
          .schema(token.schema_name)
          .bulkCreate([...allCommentResponses], {
            transaction,
          });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private validateEmail(email: string) {
    return email?.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
  }

  private duplicateEmails = (arr: string[], msg: string) => {
    arr.some((item, idx) => {
      if (arr.indexOf(item) != idx) {
        throw new BadRequestException(`(${item})` + msg);
      }
    });
  };

  private usersRepeatCheck(data: any, doCheck: boolean) {
    let rateeEmailArr: string[] = [];
    let emailsArr: string[] = [];
    let obj = {};

    data.forEach((e, index) => {
      if (!this.validateEmail(e.ratee_email) && doCheck) {
        throw new BadRequestException(
          `${e.ratee_email} is not valid format for email`
        );
      }
      if (e.ratee_email !== "") {
        rateeEmailArr.push(e.ratee_email);
        emailsArr.push(e.ratee_email);
      }

      e.categories.forEach((e) => {
        e.respondents.forEach((e) => {
          if (e.email !== "") {
            if (!this.validateEmail(e.email) && doCheck) {
              throw new BadRequestException(
                `${e.email} is not valid format for email`
              );
            }
            emailsArr.push(e.email);
            obj[index] = [...emailsArr];
          }
        });
      });
      emailsArr.length = 0;
    });

    this.duplicateEmails(
      rateeEmailArr,
      ` Email cannot be repeated for more than one ratee`
    );

    Object.values(obj).forEach((e: any) =>
      this.duplicateEmails(
        e,
        ` Email id is being repeated in different rater groups for the same ratee.`
      )
    );

    return {
      rateeEmailArr,
      emailsArr,
      obj,
    };
  }

  private getFieldMap(field: string) {
    let obj = {};
    for (const subField of field.split("&")) {
      obj[subField.split("=")[0]] = subField.split("=")[1];
    }
    return obj;
  }

  async launchSurveyProcess(survey: any, id: string) {
    try {
      survey.update({
        status: SurveyStatus.Ongoing,
      });
      this.surveyDescription.schema(this.requestParams.schema_name).update(
        {
          status: SurveyDescriptionStatus.Ongoing,
        },
        {
          where: {
            id: survey.survey_id,
          },
        }
      );

      const respondents = await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .findAll({
          where: { survey_id: id },
          attributes: ["id"],
          include: [
            {
              model: User,
              as: "respondant",
              attributes: ["name", "email", "id"],
            },
            {
              model: Rater,
              attributes: ["category_name"],
            },
          ],
        });
      const externalRespondents = await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .findAll({
          where: { survey_id: id },
          attributes: ["id", "respondant_email", "respondant_name"],
          include: [
            {
              model: Rater,
              attributes: ["category_name"],
            },
          ],
        });

      const maxLength = Math.max(
        respondents.length,
        externalRespondents.length
      );

      let tokens = [];

      for (let index = 0; index < maxLength; index++) {
        if (respondents[index]) {
          this.sendToRepondent(respondents[index], survey, tokens);
        }
        if (externalRespondents[index]) {
          this.sendToExternalRespondent(
            externalRespondents[index],
            survey,
            tokens
          );
        }
      }

      this.mailsService.sendTokens(tokens);
      await this.surveyRespondant.schema(this.requestParams.schema_name).update(
        {
          status: SurveyRespondantStatus.Ongoing,
          is_approved_by_employee: true,
          is_approved_by_line_manager: true,
        },
        {
          where: { survey_id: id },
        }
      );
      await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .update(
          {
            status: SurveyRespondantStatus.Ongoing,
            is_approved_by_employee: true,
            is_approved_by_line_manager: true,
          },
          {
            where: { survey_id: id },
          }
        );
    } catch (error) {
      console.log(error);
    }
  }

  async sendToRepondent(
    resp: SurveyRespondant,
    survey: Survey,
    tokens?: string[]
  ) {
    const token = await this.jwtService.signAsync({
      id: resp.id,
      schema_name: this.requestParams.tenant.schema_name,
      is_external: false,
    });
    if (tokens) {
      tokens.push(token);
    }

    if (survey.employee.id === resp.respondant.id) {
      let Mail = {
        to: resp.respondant.email,
        subject: `Request to complete Self Feedabck | ${survey.survey_description.title}`,
        context: {
          link: `${this.config.get(
            "FE_URL"
          )}/survey/assessment/instructions/${token}`,
          username: resp.respondant.name,
          logo: "cid:company-logo",
          ...defaultContext,
        },
        attachments: [
          {
            filename: "nbol-email-logo",
            path: "src/public/media/images/nbol-email-logo.png",
            cid: "company-logo",
          },

          ...defaultAttachments,
        ],
      };

      this.mailsService.SelfSurveyMail(Mail);
    } else {
      let Mail = {
        to: resp.respondant.email,
        subject: `Invitation to fill feedback survey | ${survey.survey_description.title}`,
        context: {
          link: `${this.config.get(
            "FE_URL"
          )}/survey/assessment/instructions/${token}`,
          username: resp.respondant.name,
          logo: "cid:company-logo",
          requester: `${survey.employee.name} ${
            survey.employee.designation &&
            `(${survey.employee.designation.name})`
          } `,
          relation: resp.rater.category_name,
          survey_name: survey.survey_description.title,
          endDate: moment(survey.survey_description.end_date).format(
            "DD/MM/YY"
          ),
          ...defaultContext,
        },
        attachments: [
          {
            filename: "nbol-email-logo",
            path: "src/public/media/images/nbol-email-logo.png",
            cid: "company-logo",
          },
          ...defaultAttachments,
        ],
      };

      this.mailsService.SurveyMail(Mail);
    }
  }

  async sendToExternalRespondent(
    resp: SurveyExternalRespondant,
    survey: Survey,
    tokens?: string[]
  ) {
    const token = await this.jwtService.signAsync({
      id: resp.id,
      schema_name: this.requestParams.tenant.schema_name,
      is_external: true,
    });

    if (tokens) {
      tokens.push(token);
    }

    let Mail = {
      to: resp.respondant_email,
      subject: `Invitation to fill feedback survey | ${survey.survey_description.title}`,
      context: {
        link: `${this.config.get(
          "FE_URL"
        )}/survey/assessment/instructions/${token}`,
        username: resp.respondant_name,
        logo: "cid:company-logo",
        requester: `${survey.employee.name} ${
          survey.employee.designation && `(${survey.employee.designation.name})`
        }`,
        relation: resp.rater.category_name,
        survey_name: survey.survey_description.title,
        endDate: moment(survey.survey_description.end_date).format("DD/MM/YY"),
        ...defaultContext,
      },
      attachments: [
        {
          filename: "nbol-email-logo",
          path: "src/public/media/images/nbol-email-logo.png",
          cid: "company-logo",
        },
        ...defaultAttachments,
      ],
    };

    this.mailsService.SurveyMail(Mail);
  }

  async afterSurveySubmitionProcess(
    body: { status: string },
    respondants: string[],
    token: any
  ) {
    try {
      if (body.status === SurveyStatus.Completed) {
        if (!token.is_external) {
          await this.surveyRespondant.schema(token.schema_name).update(
            {
              status: SurveyRespondantStatus.Completed,
              response_date: moment().format(),
            },
            { where: { id: respondants } }
          );
        } else {
          await this.surveyExternalRespondant.schema(token.schema_name).update(
            {
              status: SurveyRespondantStatus.Completed,
              response_date: moment().format(),
            },
            { where: { id: respondants } }
          );
        }

        const surveys = await this.survey.schema(token.schema_name).findAll({
          where: {
            survey_id: token.survey_id,
            status: SurveyStatus.Ongoing,
          },
          include: [
            {
              model: SurveyExternalRespondant,
              required: false,
              where: {
                status: SurveyRespondantStatus.Completed,
              },
            },
            {
              model: SurveyRespondant,
              required: false,
              where: {
                status: SurveyRespondantStatus.Completed,
              },
            },
          ],
        });
        let completedCount = 0;
        for (const survey of surveys) {
          if (
            survey.no_of_respondents ===
            survey.survey_respondants.length +
              survey.survey_external_respondants.length
          ) {
            await survey.update({ status: SurveyStatus.Completed });
            completedCount++;
          }
        }
        const surveyDescription = await this.surveyDescription
          .schema(token.schema_name)
          .findOne({
            order: [[{ model: Rater, as: "raters" }, "order", "ASC"]],
            where: {
              id: token.survey_id,
            },
            include: [
              {
                model: Rater,
                include: [
                  {
                    model: SurveyRespondant,
                    include: [
                      {
                        model: SurveyResponse,
                      },
                    ],
                  },
                  {
                    model: SurveyExternalRespondant,
                    include: [
                      {
                        model: SurveyResponse,
                      },
                    ],
                  },
                ],
              },
              {
                model: Survey,
                include: [
                  {
                    model: User,
                  },
                  {
                    model: SurveyRespondant,
                    include: [
                      {
                        model: Rater,
                      },
                      {
                        model: User,
                      },
                    ],
                  },
                  {
                    model: SurveyExternalRespondant,
                    include: [
                      {
                        model: Rater,
                      },
                    ],
                  },
                ],
              },
            ],
          });

        let completed_survey = surveyDescription.surveys.reduce(
          (prev: number, curr: Survey) =>
            curr.status === SurveyStatus.Completed ? prev + 1 : prev,
          0
        );
        const surveyids = surveyDescription.surveys.map((item) => item.id);

        let surveyDescriptionBody = {
          assessments_completed: completed_survey,
          assessments_due: literal(`total_assessments - ${completed_survey}`),
        };

        if (completed_survey === surveyDescription.total_assessments) {
          surveyDescriptionBody["status"] = SurveyDescriptionStatus.Completed;
          await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).update(
            { type: TenantHistoryTypes.completed_survey },
            {
              where: { reference_id: surveyDescription.id },
            }
          );
          await surveyDescription.update(surveyDescriptionBody);
          await this.surveyService.setBenchmark(
            surveyDescription.questionnaire_id,
            token
          );
          await this.setQuestionAvgGap(
            surveyDescription.questionnaire_id,
            token,
            surveyids
          );
          await this.reportsService.genrateReport(surveyDescription, token);
          return "Reports created successfully";
        }
        await surveyDescription.update(surveyDescriptionBody);
      }
    } catch (error) {
      console.log("error in after survey process", error);
    }
  }

  async afterSurveySubmitionProcessIndividual(
    body: { status: string },
    respondant: string[],
    survey_id: string,
    token: any
  ) {
    try {
      if (body.status === SurveyStatus.Completed) {
        if (!token.is_external) {
          await this.surveyRespondant.schema(token.schema_name).update(
            {
              status: SurveyRespondantStatus.Completed,
              response_date: moment().format(),
            },
            { where: { id: respondant } }
          );
        } else {
          await this.surveyExternalRespondant.schema(token.schema_name).update(
            {
              status: SurveyRespondantStatus.Completed,
              response_date: moment().format(),
            },
            { where: { id: respondant } }
          );
        }

        const survey = await this.survey.schema(token.schema_name).findOne({
          where: {
            id: survey_id,
            status: SurveyStatus.Ongoing,
          },
          include: [
            {
              model: SurveyExternalRespondant,
              required: false,
              where: {
                status: SurveyRespondantStatus.Completed,
              },
            },
            {
              model: SurveyRespondant,
              required: false,
              where: {
                status: SurveyRespondantStatus.Completed,
              },
            },
          ],
        });
        let completedCount = 0;
        if (
          survey.no_of_respondents ===
          survey.survey_respondants.length +
            survey.survey_external_respondants.length
        ) {
          await survey.update({ status: SurveyStatus.Completed });
          completedCount++;
        }

        const surveyDescription = await this.surveyDescription
          .schema(token.schema_name)
          .findOne({
            order: [[{ model: Rater, as: "raters" }, "order", "ASC"]],

            where: {
              id: token.survey_id,
            },
            include: [
              {
                model: Rater,
                include: [
                  {
                    model: SurveyRespondant,
                    include: [
                      {
                        model: SurveyResponse,
                      },
                    ],
                  },
                  {
                    model: SurveyExternalRespondant,
                    include: [
                      {
                        model: SurveyResponse,
                      },
                    ],
                  },
                ],
              },
              {
                model: Survey,
                include: [
                  {
                    model: User,
                  },
                  {
                    model: SurveyRespondant,
                    include: [
                      {
                        model: Rater,
                      },
                      {
                        model: User,
                      },
                    ],
                  },
                  {
                    model: SurveyExternalRespondant,
                    include: [
                      {
                        model: Rater,
                      },
                    ],
                  },
                ],
              },
            ],
          });

        let surveyDescriptionBody = {
          assessments_completed: literal(
            `assessments_completed + ${completedCount}`
          ),
          assessments_due: literal(`assessments_due - ${completedCount}`),
        };
        const surveyids = surveyDescription.surveys.map((item) => item.id);

        if (
          surveyDescription.assessments_completed + completedCount ===
          surveyDescription.total_assessments
        ) {
          surveyDescriptionBody["status"] = SurveyDescriptionStatus.Completed;
          await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).update(
            { type: TenantHistoryTypes.completed_survey },
            {
              where: { reference_id: surveyDescription.id },
            }
          );
          await surveyDescription.update(surveyDescriptionBody);
          await this.surveyService.setBenchmark(
            surveyDescription.questionnaire_id,
            token
          );

          await this.setQuestionAvgGap(
            surveyDescription.questionnaire_id,
            token,
            surveyids
          );
          await this.reportsService.genrateReport(surveyDescription, token);
          return "Reports created successfully";
        }
        await surveyDescription.update(surveyDescriptionBody);
      }
    } catch (error) {
      console.log("error in after survey process", error);
    }
  }

  async setQuestionAvgGap(
    questionnaire_id: string,
    token: any,
    surveyids: any
  ) {
    // await this.sequelize.query(`set search_path to ${token.schema_name};`);
    const responses = await SurveyResponse.schema(token.schema_name).findAll({
      where: {
        survey_id: surveyids,
      },
      include: [
        {
          model: QuestionResponse,
          as: "response",
          where: {
            is_copy: true,
            type: QuestionResponseOptions.likert_scale,
          },
        },
        {
          model: QuestionResponse,
          as: "expected_response",
          where: {
            is_copy: true,
            type: QuestionResponseOptions.likert_scale,
          },
        },
      ],
    });

    for (const response of responses) {
      if (
        response.response.label == "Don't Know" ||
        response.expected_response.label == "Don't Know"
      ) {
        await response.update({
          actual_gap:
            response.expected_response.score - response.response.score,
          is_dont_know: true,
        });
      } else {
        await response.update({
          actual_gap:
            response.expected_response.score - response.response.score,
          is_dont_know: false,
        });
      }
    }

    const data = JSON.parse(
      JSON.stringify(
        await this.question.schema(token.schema_name).findAll({
          where: {
            is_copy: true,
            response_type: QuestionResponseOptions.likert_scale,
          },
          group: ['"Question"."id"'],
          attributes: {
            include: [[fn("avg", col('"surveyResponses"."gap"')), "avg_gap"]],
          },
          include: [
            {
              model: SurveyResponse,
              as: "surveyResponses",
              attributes: [],
              required: true,
              where: {
                is_dont_know: false,
              },
              include: [
                {
                  attributes: [],
                  model: Rater,
                  required: true,
                  where: { name: { [Op.ne]: "Self" } },
                },
              ],
            },
            {
              model: QuestionnaireQuestion,
              attributes: [],
              // required: false,
              where: {
                questionnaire_id,
                is_copy: true,
              },
            },
          ],
        })
      )
    );
    await this.question.schema(token.schema_name).bulkCreate(
      data.map((item) => ({
        ...item,
        avg_gap:
          (item.avg_gap ? +(+item.avg_gap).toFixed(2) : item.avg_gap) || 0,
      })),
      {
        updateOnDuplicate: ["avg_gap"],
      }
    );
  }

  async getASurveyForEmail() {
    const surveyDescriptions = await this.survey
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          status: SurveyStatus.Ongoing,
        },
        include: [
          {
            model: SurveyDescription,
            include: [
              {
                model: Rater,
                include: [
                  {
                    model: SurveyRespondant,
                  },
                  {
                    model: SurveyExternalRespondant,
                  },
                ],
              },
            ],
          },
        ],
      });

    // surveyDescriptions.forEach((des)=>{
    //   des.raters.forEach((rater)=>{
    //     let length = rater.surveyRespondant.length
    //     let completed = 0
    //     let pending = 0
    //     rater.surveyRespondant.forEach((resp)=>{
    //       if(resp.status === SurveyRespondantStatus.Completed){
    //         completed++
    //       } else if(resp.status === SurveyRespondantStatus.Ongoing){
    //         pending++
    //       }
    //     })

    //   })
    // })

    return surveyDescriptions;
  }

  async emailTest() {
    let Mail = {
      to: "faizan.shaikh@apsissolutions.com",
      subject: `New Tenant Account Creation | Login Details for Test`,
      context: {
        firstName: "Faizan",
        lastName: "Shaikh",
        email: "email",
        password: "password",
        system_link: `${this.config.get("FE_URL")}/sign-in`,
        be_link: this.config.get("BE_URL"),
        logo: "cid:company-logo",
        username_icon: "cid:username_icon",
        password_icon: "cid:password_icon",
        arrow_icon: "cid:arrow_icon",
        ...defaultContext,
        is_tenant: true,
      },
      attachments: [
        {
          filename: "nbol-email-logo",
          path: "src/public/media/images/nbol-email-logo.png",
          cid: "company-logo",
        },
        ...defaultAttachmentsNBOL,
      ],
    };
    this.mailsService.TenantRegisterMail(Mail);
  }

  async getSurveyDetails(token: string) {
    const data = await this.getSurveyService.getFullDetailOfSurvey(token);
    return data;
  }

  async updateRater(id: string, survey_id: string, body: NBOUpdateSurveyDTO) {
    const surveyDescription = await this.survey
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          id: survey_id,
        },
        include: {
          model: SurveyDescription,
        },
      });
    const sameEmail = await this.surveyRespondant
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          survey_id: survey_id,
        },
        include: [
          {
            model: User,
            where: {
              email: body.email,
            },
          },
        ],
      });
    const sameExternalEmail = await this.surveyExternalRespondant
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          respondant_email: body.email,
          survey_id: survey_id,
        },
      });
    if (!body.is_external) {
      if (
        body.respodant_id != sameEmail?.id &&
        (sameEmail || sameExternalEmail)
      ) {
        throw new BadRequestException(
          "User with this email already exists in same ratee"
        );
      }

      let newDesignation = null;
      if (body?.designation) {
        const [designation] = await this.designation
          .schema(this.requestParams.schema_name)
          .findOrCreate({
            where: { name: body.designation },
            defaults: {
              name: body.designation,
            },
          });
        newDesignation =
          "dataValues" in designation ? designation["dataValues"] : designation;
      }

      const newuser = await this.user
        .schema(this.requestParams.schema_name)
        .findOrCreate({
          where: { email: body.email },
          defaults: {
            email: body.email,
            name: body.name,
            employee_code: body.employee_code,
            tenant_id: this.requestParams.tenant.id,
            designation_id: newDesignation ? newDesignation.id : newDesignation,
          },
        });
      const existinguser = await this.user
        .schema(this.requestParams.schema_name)
        .findOne({
          include: [
            {
              model: SurveyRespondant,
              as: "respondant",
              where: {
                id,
              },
            },
          ],
        });

      // if (newuser[1] === false) {
      await this.user.schema(this.requestParams.schema_name).update(
        {
          email: body.email,
          name: body.name,
          employee_code: body.employee_code,
          tenant_id: this.requestParams.tenant.id,
          designation_id: newDesignation ? newDesignation.id : newDesignation,
        },
        {
          where: {
            id: newuser[0].id,
          },
        }
      );
      if (existinguser.email != body.email) {
        const token = await this.jwtService.signAsync({
          id: newuser[0].id,
          survey_id: surveyDescription.survey_description.id,
          schema_name: this.requestParams.tenant.schema_name,
          is_external: false,
        });
        let Mail = {
          to: body.email,
          subject: `Invitation to fill feedback survey | ${surveyDescription.survey_description.title}`,
          context: {
            link: `${this.config.get(
              "FE_URL"
            )}/survey/assessment/instructions/${token}`,
            username: body.name,
            logo: "cid:company-logo",
            surveyTitle: surveyDescription.survey_description.title,
            tenantName: this.requestParams.tenant.name,
            endDate: moment(
              surveyDescription.survey_description.end_date
            ).format("DD/MM/YY"),
            ...defaultContext,
          },
          attachments: [
            {
              filename: "nbol-email-logo",
              path: "src/public/media/images/nbol-email-logo.png",
              cid: "company-logo",
            },
            ...defaultAttachments,
          ],
        };

        this.mailsService.SurveyMail(Mail);
      }
      // } else {

      // }

      await this.surveyRespondant.schema(this.requestParams.schema_name).update(
        {
          respondant_id: newuser[0].id,
          status: SurveyRespondantStatus.Ongoing,
        },
        {
          where: { id },
        }
      );
      const respodant_data = await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .findOne({
          where: {
            respondant_id: newuser[0].id,
          },
        });
      await this.surveyResponse.schema(this.requestParams.schema_name).destroy({
        where: {
          survey_respondant_id: body.respodant_id,
        },
      });
      // await this.competencyComment
      //   .schema(this.requestParams.schema_name)
      //   .destroy({
      //     where: {
      //       survey_respondent_id: body.respodant_id,
      //     },
      //   });
      return "Updated succesfully";
    } else {
      if (sameExternalEmail || sameEmail) {
        throw new BadRequestException(
          "User with this email already exists in the same ratee"
        );
      } else {
        const token = await this.jwtService.signAsync({
          email: body.email,
          schema_name: this.requestParams.tenant.schema_name,
          is_external: true,
          survey_id: surveyDescription.id,
        });

        let Mail = {
          to: body.email,
          subject: `Invitation to fill feedback survey | ${surveyDescription.survey_description.title}`,
          context: {
            link: `${this.config.get(
              "FE_URL"
            )}/survey/assessment/instructions/${token}`,
            username: body.name,
            logo: "cid:company-logo",
            surveyTitle: surveyDescription.survey_description.title,
            tenantName: this.requestParams.tenant.name,
            endDate: moment(
              surveyDescription.survey_description.end_date
            ).format("DD/MM/YY"),
            ...defaultContext,
          },
          attachments: [
            {
              filename: "nbol-email-logo",
              path: "src/public/media/images/nbol-email-logo.png",
              cid: "company-logo",
            },
            ...defaultAttachments,
          ],
        };

        this.mailsService.SurveyMail(Mail);

        await this.surveyResponse
          .schema(this.requestParams.schema_name)
          .destroy({
            where: {
              survey_external_respondant_id: body.respodant_id,
            },
          });
        // await this.competencyComment
        //   .schema(this.requestParams.schema_name)
        //   .destroy({
        //     where: {
        //       survey_external_respondent_id: body.respodant_id,
        //     },
        //   });
      }
      await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .update(
          {
            respondant_email: body.email,
            respondant_name: body.name,
            status: SurveyRespondantStatus.Ongoing,
          },
          {
            where: { id: body.respodant_id },
          }
        );

      return "Updated succesfully";
    }
  }

  async getFormRaterDetails(body: any) {
    let include = [];
    let order = [];
    if (body.is_external) {
      include = [
        ...include,
        {
          model: SurveyExternalRespondant,
          where: {
            respondant_email: body.email,
            // status: SurveyRespondantStatus.Ongoing,
          },
          include: [{ model: Rater }],
        },
      ];

      order = [
        [
          {
            model: SurveyExternalRespondant,
            as: "survey_external_respondants",
          },
          { model: Rater, as: "rater" },
          "order",
          "ASC",
        ],
      ];
    } else {
      include = [
        ...include,
        {
          model: SurveyRespondant,
          where: {
            respondant_id: body.id,
            // status: SurveyRespondantStatus.Ongoing,
          },
          include: [
            { model: Rater },
            {
              model: User,
              attributes: ["email", "id", "name"],
            },
          ],
        },
      ];

      order = [
        [
          { model: SurveyRespondant, as: "survey_respondants" },
          { model: Rater, as: "rater" },
          "order",
          "ASC",
        ],
      ];
    }

    const surveys = await this.survey
      .schema(this.requestParams.schema_name)
      .unscoped()
      .findAll({
        order: order,
        where: {
          survey_id: body.survey_id,
          // status: SurveyStatus.Ongoing,
        },
        include: [
          {
            model: User,
          },
          {
            model: SurveyDescription,
            attributes: ["client_contact"],
          },
          ...include,
        ],
      });

    return surveys;
  }

  async updateSurveyRatee(data: SurveyRespondentupdateDTO, id: string) {
    console.log(data,"DATA>>>>>>>>>>");
    
    const survey = await this.survey
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          id,
        },
        include: [
          {
            model: SurveyDescription,
          },
        ],
      });

    if (!survey) throw new NotFoundException("User not found");
    const transaction = await this.sequelize.transaction();

    let departments = {};
    let alreadyFoundedUsers = {};
    let designations = {};
    let department;
    let designation;
    let employees = [];
    let respondents = [];
    let allCommentResponses = [];
    let externalRespondents = [];

    const selfRater = await this.rater
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          name: "Self",
          survey_description_id: survey.survey_id,
        },
      });

    try {
      if (data.department) {
        // check if department is already in departments or not if not in departments then create
        if (!departments[data.department]) {
          let newDepartment = await this.department
            .schema(this.requestParams.schema_name)
            .findOrCreate({
              where: { name: data.department },
              defaults: {
                name: data.department,
              },
              transaction,
            });
          departments[data.department] = newDepartment[0];
        }
        department = departments[data.department];
      }
      if (data.designation) {
        // check if designation is already in designations or not if not in designations then create
        if (!designations[data.designation]) {
          let newDesignation = await this.designation
            .schema(this.requestParams.schema_name)
            .findOrCreate({
              where: { name: data.designation },
              defaults: {
                name: data.designation,
              },
              transaction,
            });
          designations[data.designation] = newDesignation[0];
        }
        designation = designations[data.designation];
      }

      // check if this user is already there in already founded users object if not then finr or create then set in alreadyFoundedUsers
      if (!alreadyFoundedUsers[data.email]) {
        const isTenantuser = await this.tenantUser
          .schema(DB_PUBLIC_SCHEMA)
          .findOne({
            where: { email: data.email },
            include: [{ model: Tenant }],
          });

        if (isTenantuser) {
          if (isTenantuser.my_tenant.is_channel_partner) {
            throw new BadRequestException(
              `User with this (${data.email}) email already exists!`
            );
          }

          if (
            isTenantuser.my_tenant.schema_name !==
            this.requestParams.schema_name
          ) {
            const isUserInTenant = await User.schema(
              isTenantuser.my_tenant.schema_name
            ).findOne({
              where: { email: data.email },
            });
            if (isUserInTenant)
              throw new BadRequestException(
                `User with this (${data.email}) email already exists!`
              );
          }
        }
        // find or create user from db
        const [newUser] = await this.user
          .schema(this.requestParams.schema_name)
          .findOrCreate({
            where: {
              email: data.email,
            },
            defaults: {
              name: data.name,
              email: data.email,
              employee_code: data.employee_code,
              contact: data.contact,
              department_id: data.department ? department?.id : null,
              designation_id: data.designation ? designation?.id : null,
              tenant_id: this.requestParams.tenant.id,
            },
            transaction,
          });
        alreadyFoundedUsers[data.email] = newUser;
      }
      console.log("AFter CreateOrFind");
      
      let newUser = alreadyFoundedUsers[data.email];
      await survey.update(
        {
          employee_id: newUser.id,
          status: SurveyStatus.Ongoing,
        },
        { transaction }
      );

      if (data.raters && data.raters.length) {
        respondents.push({
          survey_id: survey.id,
          respondant_id: newUser.id,
          relationship_with_employee_id: selfRater.id,
          is_selected_by_system: true,
          is_approved_by_employee: true,
          is_approved_by_line_manager: true,
          status: SurveyRespondantStatus.Ongoing,
        });
        await this.commentResponse.schema(this.requestParams.schema_name).destroy(
          {
            where:{
              survey_id: survey.id,
            },
            transaction,
          }
        )
        await this.surveyRespondant
          .schema(this.requestParams.schema_name)
          .destroy({
            where: {
              survey_id: survey.id,
            },
            transaction,
          });
        await this.surveyExternalRespondant
          .schema(this.requestParams.schema_name)
          .destroy({
            where: {
              survey_id: survey.id,
            },
            transaction,
          });

        employees.push(newUser.id);
        let number_of_respondents = 1;
        for (const category of data.raters) {
          if (!category.is_external) {
            for (const respondent of category.surveyRespondant) {
              let respondent_designation;
              if (respondent.designation) {
                // check if designation is already in designations or not if not in designations then create
                if (!designations[respondent.designation]) {
                  let newDesignation = await this.designation
                    .schema(this.requestParams.schema_name)
                    .findOrCreate({
                      where: { name: respondent.designation },
                      defaults: {
                        name: respondent.designation,
                      },
                      transaction,
                    });
                  designations[respondent.designation] = newDesignation[0];
                }
                respondent_designation = designations[respondent.designation];
              }

              let respondent_department;
              if (respondent.department) {
                // check if designation is already in designations or not if not in designations then create
                if (!departments[respondent.department]) {
                  let newDepartment = await this.department
                    .schema(this.requestParams.schema_name)
                    .findOrCreate({
                      where: { name: respondent.department },
                      defaults: {
                        name: respondent.department,
                      },
                      transaction,
                    });
                  departments[respondent.department] = newDepartment[0];
                }
                respondent_department = departments[respondent.department];
              }

              if (respondent.email) {
                // check if this user is already there in already founded users object if not then finr or create then set in alreadyFoundedUsers
                if (!alreadyFoundedUsers[respondent.email]) {
                  const isTenantuser = await this.tenantUser
                    .schema(DB_PUBLIC_SCHEMA)
                    .findOne({
                      where: { email: respondent.email },
                      include: [{ model: Tenant.schema(DB_PUBLIC_SCHEMA) }],
                    });

                  if (isTenantuser) {
                    if (isTenantuser.my_tenant.is_channel_partner) {
                      throw new BadRequestException(
                        `User with this (${respondent.email}) email already exists!`
                      );
                    }
                    if (
                      isTenantuser.my_tenant.schema_name !==
                      this.requestParams.schema_name
                    ) {
                      const isUserInTenant = await User.schema(
                        isTenantuser.my_tenant.schema_name
                      ).findOne({
                        where: { email: respondent.email },
                      });
                      if (isUserInTenant)
                        throw new BadRequestException(
                          `User with this (${respondent.email}) email already exists!`
                        );
                    }
                  }
                  // find or create user from db
                  const [newRespondent] = await this.user
                    .schema(this.requestParams.schema_name)
                    .findOrCreate({
                      where: {
                        email: respondent.email,
                      },
                      defaults: {
                        name: respondent.name,
                        email: respondent.email,
                        contact: respondent.contact,
                        employee_code: respondent.employee_code,
                        designation_id: respondent_designation?.id,
                        department_id: respondent_department?.id,
                        tenant_id: this.requestParams.tenant.id,
                      },
                      transaction,
                    });
                  alreadyFoundedUsers[respondent.email] = newRespondent;
                }

                let newRespondent = alreadyFoundedUsers[respondent.email];
                number_of_respondents++;

                respondents.push({
                  status: SurveyRespondantStatus.Ongoing,
                  survey_id: survey.id,
                  respondant_id: newRespondent.id,
                  relationship_with_employee_id: category.id,
                  is_selected_by_system: false,
                  is_approved_by_employee: true,
                  is_approved_by_line_manager: true,
                });
                
              }
            }
          } else {
            for (const respondant of category.surveyExternalRespondant) {
              if (respondant.respondant_email) {
                if (!alreadyFoundedUsers[respondant.respondant_email]) {
                  // find or create user from db
                  const newRespondent = await this.user
                    .schema(this.requestParams.schema_name)
                    .findOne({
                      where: {
                        email: respondant.respondant_email,
                      },
                    });
                  if (newRespondent) {
                    throw new BadRequestException(
                      `Users of this tenant can not be used as external respondent in survey, check user with (${respondant.respondant_email}) as email`
                    );
                  }
                } else {
                  throw new BadRequestException(
                    `Users of this tenant can not be used as external respondent in survey, check user with (${respondant.respondant_email}) as email`
                  );
                }
                externalRespondents.push({
                  status: SurveyRespondantStatus.Ongoing,
                  survey_id: survey.id,
                  respondant_email: respondant.respondant_email,
                  respondant_name: respondant.respondant_name,
                  relationship_with_employee_id: category.id,
                  // relationship_with_employee_id: category.category_id,
                  is_approved_by_employee: true,
                  is_approved_by_line_manager: true,
                });
                number_of_respondents++;
                
              }
            }
          }
        }

        await survey.update(
          {
            no_of_respondents: number_of_respondents,
          },
          {
            transaction,
          }
        );

        await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .bulkCreate(respondents, { transaction });
        await this.surveyExternalRespondant
          .schema(this.requestParams.schema_name)
          .bulkCreate(externalRespondents, {
            transaction,
          });
          
          await transaction.commit();
          
          const respondants = await this.surveyRespondant
          .schema(this.requestParams.schema_name)
          .findAll({
            include: [
              {
                attributes: ["id"],
                model: Survey,
                where: {
                  id,
                },
              },
              {
                model: User,
                attributes: ["name", "email", "id"],
              },
            ],
          });
        const externalRespondants = await this.surveyExternalRespondant
          .schema(this.requestParams.schema_name)
          .unscoped()
          .findAll({
            include: [
              {
                attributes: ["id"],
                model: Survey,
                where: {
                  id,
                },
              },
            ],
          });
          for (let resp of respondants) {
            allCommentResponses.push(
              ...[
                {
                  survey_id: resp.survey.id,
                  response_text: "",
                  question_type: "strength",
                  survey_respondent_id: resp.id,
                  survey_external_respondent_id: null,
                  category_id: resp.relationship_with_employee_id,
                },
                {
                  survey_id: resp.survey.id,
                  response_text: "",
                  question_type: "weakness",
                  survey_respondent_id: resp.id,
                  survey_external_respondent_id: null,
                  category_id: resp.relationship_with_employee_id,
                },
              ]
            );
          }
          for (let resp of externalRespondants) {
            allCommentResponses.push(
              ...[
                {
                  survey_id: resp.survey.id,
                  response_text: "",
                  question_type: "strength",
                  survey_respondent_id: null,
                  survey_external_respondent_id: resp.id,
                  category_id: resp.relationship_with_employee_id,
                },
                {
                  survey_id: resp.survey.id,
                  response_text: "",
                  question_type: "weakness",
                  survey_respondent_id: null,
                  survey_external_respondent_id: resp.id,
                  category_id: resp.relationship_with_employee_id,
                },
              ]
              );
          }
          
          console.log(allCommentResponses,"allCommentResponses");
          
      await this.commentResponse
      .schema(this.requestParams.schema_name)
      .bulkCreate(allCommentResponses);
        const maxLength = Math.max(
          respondants.length,
          externalRespondants.length
        );
        let alreadySent = [];
        let alreadySentExternal = [];
        let tokens = [];
        for (let index = 0; index < maxLength; index++) {
          if (
            respondants[index] &&
            !alreadySent.includes(respondants[index].respondant.email)
          ) {
            const token = await this.jwtService.signAsync({
              id: respondants[index].respondant.id,
              survey_id: survey.survey_id,
              schema_name: this.requestParams.tenant.schema_name,
              is_external: false,
            });
            if (tokens) {
              tokens.push(token);
            }

            let Mail = {
              to: respondants[index].respondant.email,
              subject: `Invitation to fill feedback survey | ${survey.survey_description.title}`,
              context: {
                link: `${this.config.get(
                  "FE_URL"
                )}/survey/assessment/instructions/${token}`,
                username: respondants[index].respondant.name,
                logo: "cid:company-logo",
                surveyTitle: survey.survey_description.title,
                tenantName: this.requestParams.tenant.name,
                endDate: moment(survey.survey_description.end_date).format(
                  "DD/MM/YY"
                ),
                ...defaultContext,
              },
              attachments: [
                {
                  filename: "nbol-email-logo",
                  path: "src/public/media/images/nbol-email-logo.png",
                  cid: "company-logo",
                },
                ...defaultAttachments,
              ],
            };

            this.mailsService.SurveyMail(Mail);
            alreadySent.push(respondants[index].respondant.email);
          }
          if (
            externalRespondants[index] &&
            !alreadySentExternal.includes(
              externalRespondants[index].respondant_email
            )
          ) {
            const token = await this.jwtService.signAsync({
              email: externalRespondants[index].respondant_email,
              schema_name: this.requestParams.tenant.schema_name,
              is_external: true,
              survey_id: survey.survey_id,
            });

            if (tokens) {
              tokens.push(token);
            }

            let Mail = {
              to: externalRespondants[index].respondant_email,
              subject: `Invitation to fill feedback survey | ${survey.survey_description.title}`,
              context: {
                link: `${this.config.get(
                  "FE_URL"
                )}/survey/assessment/instructions/${token}`,
                username: externalRespondants[index].respondant_name,
                logo: "cid:company-logo",
                surveyTitle: survey.survey_description.title,
                tenantName: this.requestParams.tenant.name,
                endDate: moment(survey.survey_description.end_date).format(
                  "DD/MM/YY"
                ),
                ...defaultContext,
              },
              attachments: [
                {
                  filename: "nbol-email-logo",
                  path: "src/public/media/images/nbol-email-logo.png",
                  cid: "company-logo",
                },
                ...defaultAttachments,
              ],
            };

            this.mailsService.SurveyMail(Mail);
            alreadySentExternal.push(
              externalRespondants[index].respondant_email
            );
          }
        }
      }
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      throw error;
    }
  }

  async addSurveyRatee(data: SurveyRespondentupdateDTO, id: string) {
    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          id,
        },
        include: [
          {
            model: SurveyDescription,
          },
        ],
      });

    if (!surveyDescription) throw new NotFoundException("Survey not found");
    const transaction = await this.sequelize.transaction();

    let departments = {};
    let alreadyFoundedUsers = {};
    let designations = {};
    let department;
    let designation;
    let employees = [];
    let respondents = [];
    let externalRespondents = [];

    const selfRater = await this.rater
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          name: "Self",
          survey_description_id: surveyDescription.id,
        },
      });

    try {
      if (data.department) {
        // check if department is already in departments or not if not in departments then create
        if (!departments[data.department]) {
          let newDepartment = await this.department
            .schema(this.requestParams.schema_name)
            .findOrCreate({
              where: { name: data.department },
              defaults: {
                name: data.department,
              },
              transaction,
            });
          departments[data.department] = newDepartment[0];
        }
        department = departments[data.department];
      }
      if (data.designation) {
        // check if designation is already in designations or not if not in designations then create
        if (!designations[data.designation]) {
          let newDesignation = await this.designation
            .schema(this.requestParams.schema_name)
            .findOrCreate({
              where: { name: data.designation },
              defaults: {
                name: data.designation,
              },
              transaction,
            });
          designations[data.designation] = newDesignation[0];
        }
        designation = designations[data.designation];
      }

      // check if this user is already there in already founded users object if not then finr or create then set in alreadyFoundedUsers
      if (!alreadyFoundedUsers[data.email]) {
        const isTenantuser = await this.tenantUser
          .schema(DB_PUBLIC_SCHEMA)
          .findOne({
            where: { email: data.email },
            include: [{ model: Tenant }],
          });

        if (isTenantuser) {
          if (isTenantuser.my_tenant.is_channel_partner) {
            throw new BadRequestException(
              `User with this (${data.email}) email already exists!`
            );
          }

          if (
            isTenantuser.my_tenant.schema_name !==
            this.requestParams.schema_name
          ) {
            const isUserInTenant = await User.schema(
              isTenantuser.my_tenant.schema_name
            ).findOne({
              where: { email: data.email },
            });
            if (isUserInTenant)
              throw new BadRequestException(
                `User with this (${data.email}) email already exists!`
              );
          }
        }
        // find or create user from db
        const [newUser] = await this.user
          .schema(this.requestParams.schema_name)
          .findOrCreate({
            where: {
              email: data.email,
            },
            defaults: {
              name: data.name,
              email: data.email,
              employee_code: data.employee_code,
              contact: data.contact,
              department_id: data.department ? department?.id : null,
              designation_id: data.designation ? designation?.id : null,
              tenant_id: this.requestParams.tenant.id,
            },
            transaction,
          });
        alreadyFoundedUsers[data.email] = newUser;
      }

      let newUser = alreadyFoundedUsers[data.email];
      let survey = await this.survey.create({
        survey_id: surveyDescription.id,
        employee_id: newUser.id,
        status: SurveyStatus.Ongoing,
      });

      if (data.raters && data.raters.length) {
        respondents.push({
          survey_id: survey.id,
          respondant_id: newUser.id,
          relationship_with_employee_id: selfRater.id,
          is_selected_by_system: true,
          is_approved_by_employee: true,
          is_approved_by_line_manager: true,
          status: SurveyRespondantStatus.Ongoing,
        });

        await this.surveyRespondant
          .schema(this.requestParams.schema_name)
          .destroy({
            where: {
              survey_id: survey.id,
            },
            transaction,
          });
        await this.surveyExternalRespondant
          .schema(this.requestParams.schema_name)
          .destroy({
            where: {
              survey_id: survey.id,
            },
            transaction,
          });

        employees.push(newUser.id);
        let number_of_respondents = 1;
        for (const category of data.raters) {
          if (!category.is_external) {
            for (const respondent of category.surveyRespondant) {
              let respondent_designation;
              if (respondent.designation) {
                // check if designation is already in designations or not if not in designations then create
                if (!designations[respondent.designation]) {
                  let newDesignation = await this.designation
                    .schema(this.requestParams.schema_name)
                    .findOrCreate({
                      where: { name: respondent.designation },
                      defaults: {
                        name: respondent.designation,
                      },
                      transaction,
                    });
                  designations[respondent.designation] = newDesignation[0];
                }
                respondent_designation = designations[respondent.designation];
              }

              let respondent_department;
              if (respondent.department) {
                // check if designation is already in designations or not if not in designations then create
                if (!departments[respondent.department]) {
                  let newDepartment = await this.department
                    .schema(this.requestParams.schema_name)
                    .findOrCreate({
                      where: { name: respondent.department },
                      defaults: {
                        name: respondent.department,
                      },
                      transaction,
                    });
                  departments[respondent.department] = newDepartment[0];
                }
                respondent_department = departments[respondent.department];
              }

              if (respondent.email) {
                // check if this user is already there in already founded users object if not then finr or create then set in alreadyFoundedUsers
                if (!alreadyFoundedUsers[respondent.email]) {
                  const isTenantuser = await this.tenantUser
                    .schema(DB_PUBLIC_SCHEMA)
                    .findOne({
                      where: { email: respondent.email },
                      include: [{ model: Tenant.schema(DB_PUBLIC_SCHEMA) }],
                    });

                  if (isTenantuser) {
                    if (isTenantuser.my_tenant.is_channel_partner) {
                      throw new BadRequestException(
                        `User with this (${respondent.email}) email already exists!`
                      );
                    }
                    if (
                      isTenantuser.my_tenant.schema_name !==
                      this.requestParams.schema_name
                    ) {
                      const isUserInTenant = await User.schema(
                        isTenantuser.my_tenant.schema_name
                      ).findOne({
                        where: { email: respondent.email },
                      });
                      if (isUserInTenant)
                        throw new BadRequestException(
                          `User with this (${respondent.email}) email already exists!`
                        );
                    }
                  }
                  // find or create user from db
                  const [newRespondent] = await this.user
                    .schema(this.requestParams.schema_name)
                    .findOrCreate({
                      where: {
                        email: respondent.email,
                      },
                      defaults: {
                        name: respondent.name,
                        email: respondent.email,
                        contact: respondent.contact,
                        employee_code: respondent.employee_code,
                        designation_id: respondent_designation?.id,
                        department_id: respondent_department?.id,
                        tenant_id: this.requestParams.tenant.id,
                      },
                      transaction,
                    });
                  alreadyFoundedUsers[respondent.email] = newRespondent;
                }

                let newRespondent = alreadyFoundedUsers[respondent.email];
                number_of_respondents++;

                respondents.push({
                  status: SurveyRespondantStatus.Ongoing,
                  survey_id: survey.id,
                  respondant_id: newRespondent.id,
                  relationship_with_employee_id: category.id,
                  is_selected_by_system: false,
                  is_approved_by_employee: true,
                  is_approved_by_line_manager: true,
                });
              }
            }
          } else {
            for (const respondant of category.surveyExternalRespondant) {
              if (respondant.respondant_email) {
                if (!alreadyFoundedUsers[respondant.respondant_email]) {
                  // find or create user from db
                  const newRespondent = await this.user
                    .schema(this.requestParams.schema_name)
                    .findOne({
                      where: {
                        email: respondant.respondant_email,
                      },
                    });
                  if (newRespondent) {
                    throw new BadRequestException(
                      `Users of this tenant can not be used as external respondent in survey, check user with (${respondant.respondant_email}) as email`
                    );
                  }
                } else {
                  throw new BadRequestException(
                    `Users of this tenant can not be used as external respondent in survey, check user with (${respondant.respondant_email}) as email`
                  );
                }
                externalRespondents.push({
                  status: SurveyRespondantStatus.Ongoing,
                  survey_id: survey.id,
                  respondant_email: respondant.respondant_email,
                  respondant_name: respondant.respondant_name,
                  relationship_with_employee_id: category.id,
                  // relationship_with_employee_id: category.category_id,
                  is_approved_by_employee: true,
                  is_approved_by_line_manager: true,
                });
                number_of_respondents++;
              }
            }
          }
        }

        await survey.update(
          {
            no_of_respondents: number_of_respondents,
          },
          {
            transaction,
          }
        );

        await this.surveyRespondant
          .schema(this.requestParams.schema_name)
          .bulkCreate(respondents, { transaction });
        await this.surveyExternalRespondant
          .schema(this.requestParams.schema_name)
          .bulkCreate(externalRespondents, {
            transaction,
          });

        await transaction.commit();

        const respondants = await this.surveyRespondant
          .schema(this.requestParams.schema_name)
          .findAll({
            include: [
              {
                attributes: [],
                model: Survey,
                where: {
                  id,
                },
              },
              {
                model: User,
                attributes: ["name", "email", "id"],
              },
            ],
          });
        const externalRespondants = await this.surveyExternalRespondant
          .schema(this.requestParams.schema_name)
          .unscoped()
          .findAll({
            include: [
              {
                attributes: [],
                model: Survey,
                where: {
                  id,
                },
              },
            ],
          });
        const maxLength = Math.max(
          respondants.length,
          externalRespondants.length
        );
        let alreadySent = [];
        let alreadySentExternal = [];
        let tokens = [];
        for (let index = 0; index < maxLength; index++) {
          if (
            respondants[index] &&
            !alreadySent.includes(respondants[index].respondant.email)
          ) {
            const token = await this.jwtService.signAsync({
              id: respondants[index].respondant.id,
              survey_id: survey.survey_id,
              schema_name: this.requestParams.tenant.schema_name,
              is_external: false,
            });
            if (tokens) {
              tokens.push(token);
            }

            let Mail = {
              to: respondants[index].respondant.email,
              subject: `Invitation to fill feedback survey | ${survey.survey_description.title}`,
              context: {
                link: `${this.config.get(
                  "FE_URL"
                )}/survey/assessment/instructions/${token}`,
                username: respondants[index].respondant.name,
                logo: "cid:company-logo",
                surveyTitle: survey.survey_description.title,
                tenantName: this.requestParams.tenant.name,
                endDate: moment(survey.survey_description.end_date).format(
                  "DD/MM/YY"
                ),
                ...defaultContext,
              },
              attachments: [
                {
                  filename: "nbol-email-logo",
                  path: "src/public/media/images/nbol-email-logo.png",
                  cid: "company-logo",
                },
                ...defaultAttachments,
              ],
            };

            this.mailsService.SurveyMail(Mail);
            alreadySent.push(respondants[index].respondant.email);
          }
          if (
            externalRespondants[index] &&
            !alreadySentExternal.includes(
              externalRespondants[index].respondant_email
            )
          ) {
            const token = await this.jwtService.signAsync({
              email: externalRespondants[index].respondant_email,
              schema_name: this.requestParams.tenant.schema_name,
              is_external: true,
              survey_id: survey.survey_id,
            });

            if (tokens) {
              tokens.push(token);
            }

            let Mail = {
              to: externalRespondants[index].respondant_email,
              subject: `Invitation to fill feedback survey | ${survey.survey_description.title}`,
              context: {
                link: `${this.config.get(
                  "FE_URL"
                )}/survey/assessment/instructions/${token}`,
                username: externalRespondants[index].respondant_name,
                logo: "cid:company-logo",
                surveyTitle: survey.survey_description.title,
                tenantName: this.requestParams.tenant.name,
                endDate: moment(survey.survey_description.end_date).format(
                  "DD/MM/YY"
                ),
                ...defaultContext,
              },
              attachments: [
                {
                  filename: "nbol-email-logo",
                  path: "src/public/media/images/nbol-email-logo.png",
                  cid: "company-logo",
                },
                ...defaultAttachments,
              ],
            };

            this.mailsService.SurveyMail(Mail);
            alreadySentExternal.push(
              externalRespondants[index].respondant_email
            );
          }
        }
      }
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteRatee(id: string) {
    let survey = await this.survey
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id },
      });

    await this.surveyRespondant.schema(this.requestParams.schema_name).destroy({
      where: {
        survey_id: id,
      },
    });

    await this.surveyExternalRespondant
      .schema(this.requestParams.schema_name)
      .destroy({
        where: {
          survey_id: id,
        },
      });

    await this.survey
      .schema(this.requestParams.schema_name)
      .destroy({ where: { id } });

    const countOfCompletedSurveys = await this.survey
      .schema(this.requestParams.schema_name)
      .count({
        where: {
          survey_id: survey.survey_id,
          status: SurveyStatus.Completed,
        },
      });

    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        order: [[{ model: Rater, as: "raters" }, "order", "ASC"]],
        where: {
          id: survey.survey_id,
        },
        include: [
          {
            model: Rater,
            include: [
              {
                model: SurveyRespondant,
                include: [
                  {
                    model: SurveyResponse,
                  },
                ],
              },
              {
                model: SurveyExternalRespondant,
                include: [
                  {
                    model: SurveyResponse,
                  },
                ],
              },
            ],
          },
          {
            model: Survey,
            include: [
              {
                model: User,
              },
              {
                model: SurveyRespondant,
                include: [
                  {
                    model: Rater,
                  },
                  {
                    model: User,
                  },
                ],
              },
              {
                model: SurveyExternalRespondant,
                include: [
                  {
                    model: Rater,
                  },
                ],
              },
            ],
          },
        ],
      });

    let updateAssessments = {
      assessments_due: literal("assessments_due - 1"),
      total_assessments: literal("total_assessments - 1"),
    };
    const surveyids = surveyDescription.surveys.map((item) => item.id);

    await surveyDescription.update(updateAssessments);

    await surveyDescription.reload();

    let surveyDescriptionBody = {};

    if (countOfCompletedSurveys === surveyDescription.total_assessments) {
      surveyDescriptionBody["status"] = SurveyDescriptionStatus.Completed;
      await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).update(
        { type: TenantHistoryTypes.completed_survey },
        {
          where: { reference_id: surveyDescription.id },
        }
      );

      await surveyDescription.update(surveyDescriptionBody);

      await this.surveyService.setBenchmark(
        surveyDescription.questionnaire_id,
        { schema_name: this.requestParams.schema_name }
      );
      await this.setQuestionAvgGap(
        surveyDescription.questionnaire_id,
        {
          schema_name: this.requestParams.schema_name,
        },
        surveyids
      );
      await this.reportsService.genrateReport(surveyDescription, {
        id: id,
        schema_name: this.requestParams.schema_name,
      });
      return "Reports created successfully";
    }
  }

  async deleteRater(id: string, survey_id: string, is_external: boolean) {
    let survey = await this.survey
      .schema(this.requestParams.schema_name)
      .findOne({
        where: { id: survey_id },
      });

    if (!is_external) {
      await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .destroy({
          where: {
            survey_id: survey?.id,
            respondant_id: id,
          },
        });
    } else {
      await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .destroy({
          where: {
            survey_id: survey?.id,
            id,
          },
        });
    }

    await survey.decrement("no_of_respondents");

    const countOfCompletedSurveyRespondents = await this.surveyRespondant
      .schema(this.requestParams.schema_name)
      .count({
        where: {
          survey_id: survey.id,
          status: SurveyRespondantStatus.Completed,
        },
      });

    const countOfCompletedSurveyExternalRespondents =
      await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .count({
          where: {
            survey_id: survey.id,
            status: SurveyRespondantStatus.Completed,
          },
        });

    if (
      countOfCompletedSurveyExternalRespondents +
        countOfCompletedSurveyRespondents ===
      survey.no_of_respondents
    ) {
      await survey.update({
        status: SurveyStatus.Completed,
      });

      const countOfCompletedSurveys = await this.survey
        .schema(this.requestParams.schema_name)
        .count({
          where: {
            survey_id: survey.survey_id,
            status: SurveyStatus.Completed,
          },
        });

      const surveyDescription = await this.surveyDescription
        .schema(this.requestParams.schema_name)
        .findOne({
          order: [[{ model: Rater, as: "raters" }, "order", "ASC"]],
          where: {
            id: survey.survey_id,
          },
          include: [
            {
              model: Rater,
              include: [
                {
                  model: SurveyRespondant,
                  include: [
                    {
                      model: SurveyResponse,
                    },
                  ],
                },
                {
                  model: SurveyExternalRespondant,
                  include: [
                    {
                      model: SurveyResponse,
                    },
                  ],
                },
              ],
            },
            {
              model: Survey,
              include: [
                {
                  model: User,
                },
                {
                  model: SurveyRespondant,
                  include: [
                    {
                      model: Rater,
                    },
                    {
                      model: User,
                    },
                  ],
                },
                {
                  model: SurveyExternalRespondant,
                  include: [
                    {
                      model: Rater,
                    },
                  ],
                },
              ],
            },
          ],
        });

      let surveyDescriptionBody = {
        assessments_completed: literal("assessments_completed + 1"),
        assessments_due: literal("assessments_due - 1"),
      };
      const surveyids = surveyDescription.surveys.map((item) => item.id);

      if (countOfCompletedSurveys === surveyDescription.total_assessments) {
        surveyDescriptionBody["status"] = SurveyDescriptionStatus.Completed;
        await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).update(
          { type: TenantHistoryTypes.completed_survey },
          {
            where: { reference_id: surveyDescription.id },
          }
        );
        await surveyDescription.update(surveyDescriptionBody);
        await this.surveyService.setBenchmark(
          surveyDescription.questionnaire_id,
          { schema_name: this.requestParams.schema_name }
        );
        await this.setQuestionAvgGap(
          surveyDescription.questionnaire_id,
          {
            schema_name: this.requestParams.schema_name,
          },
          surveyids
        );
        await this.reportsService.genrateReport(surveyDescription, {
          id: id,
          schema_name: this.requestParams.schema_name,
          is_external: is_external ? true : false,
        });
        return "Reports created successfully";
      }
    }
  }

  async addSurveyRespondent(data: SurveyRespondentAddDTO, id: string) {
    let isAlreadyExist = null;
    if (data.respondant.rater.is_external) {
      isAlreadyExist = await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .findOne({
          where: {
            respondant_email: data.email,
            survey_id: id,
          },
        });
    } else {
      isAlreadyExist = await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .findOne({
          where: {
            survey_id: id,
          },
          include: [{ model: User, where: { email: data?.email } }],
        });
    }

    if (isAlreadyExist) {
      throw new BadRequestException(
        `User with  email ${data?.email} already exists in same ratee`
      );
    }

    if (data.respondant.rater.is_external) {
      const newRespondent = await this.user
        .schema(this.requestParams.schema_name)
        .findOne({
          where: {
            email: data.email,
          },
        });
      if (newRespondent) {
        throw new BadRequestException(
          `Users of this tenant can not be used as external respondent in survey, check user with (${data.email}) as email`
        );
      }
    } else {
      const isTenantuser = await this.tenantUser
        .schema(DB_PUBLIC_SCHEMA)
        .findOne({
          where: { email: data.email },
          include: [{ model: Tenant.schema(DB_PUBLIC_SCHEMA) }],
        });

      if (isTenantuser) {
        if (isTenantuser.my_tenant.is_channel_partner) {
          throw new BadRequestException(
            `User with this (${data.email}) email already exists!`
          );
        }
        if (
          isTenantuser.my_tenant.schema_name !== this.requestParams.schema_name
        ) {
          const isUserInTenant = await User.schema(
            isTenantuser.my_tenant.schema_name
          ).findOne({
            where: { email: data.email },
          });
          if (isUserInTenant)
            throw new BadRequestException(
              `User with this (${data.email}) email already exists!`
            );
        }
      }
    }

    let newDepartment = null;
    if (data?.department) {
      const [department] = await this.department
        .schema(this.requestParams.schema_name)
        .findOrCreate({
          where: { name: data?.department },
          defaults: {
            name: data?.department,
          },
        });
      newDepartment =
        "dataValues" in department ? department["dataValues"] : department;
    }

    let newDesignation = null;
    if (data?.designation) {
      const [designation] = await this.designation
        .schema(this.requestParams.schema_name)
        .findOrCreate({
          where: { name: data?.designation },
          defaults: {
            name: data?.designation,
          },
        });
      newDesignation =
        "dataValues" in designation ? designation["dataValues"] : designation;
    }

    const [newUser] = await this.user
      .schema(this.requestParams.schema_name)
      .findOrCreate({
        where: { email: data?.email },
        defaults: {
          email: data?.email,
          name: data?.name,
          employee_code: data?.employee_code,
          tenant_id: this.requestParams.tenant.id,
          designation_id: newDesignation ? newDesignation.id : newDesignation,
          department_id: newDepartment ? newDepartment.id : newDepartment,
        },
      });

    if (data.respondant.rater.is_external) {
      await this.surveyExternalRespondant
        .schema(this.requestParams.schema_name)
        .create({
          status: SurveyRespondantStatus.Ongoing,
          survey_id: id,
          respondant_email: data.email,
          respondant_name: data.name,
          relationship_with_employee_id: data.respondant.rater.id,
          is_approved_by_employee: true,
          is_approved_by_line_manager: true,
        });
    } else {
      await this.surveyRespondant
        .schema(this.requestParams.schema_name)
        .create({
          status: SurveyRespondantStatus.Ongoing,
          survey_id: id,
          respondant_id: newUser.id,
          relationship_with_employee_id: data.respondant.rater.id,
          is_selected_by_system: false,
          is_approved_by_employee: true,
          is_approved_by_line_manager: true,
        });
    }

    let updatedSurvey = await this.survey
      .schema(this.requestParams.schema_name)
      .increment("no_of_respondents", { where: { survey_id: id } });

    let surveyDescription = await this.survey
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          id,
        },
        include: [{ model: SurveyDescription }],
      });

    if (data.respondant.rater.is_external) {
      const token = await this.jwtService.signAsync({
        email: data.email,
        schema_name: this.requestParams.tenant.schema_name,
        is_external: data.respondant.rater.is_external ? true : false,
        survey_id: surveyDescription.survey_description.id,
      });

      let Mail = {
        to: data.email,
        subject: `Invitation to fill feedback survey | ${surveyDescription.survey_description.title}`,
        context: {
          link: `${this.config.get(
            "FE_URL"
          )}/survey/assessment/instructions/${token}`,
          username: data.name,
          logo: "cid:company-logo",
          surveyTitle: surveyDescription.survey_description.title,
          tenantName: this.requestParams.tenant.name,
          endDate: moment(surveyDescription.survey_description.end_date).format(
            "DD/MM/YY"
          ),
          ...defaultContext,
        },
        attachments: [
          {
            filename: "nbol-email-logo",
            path: "src/public/media/images/nbol-email-logo.png",
            cid: "company-logo",
          },
          ...defaultAttachments,
        ],
      };

      this.mailsService.SurveyMail(Mail);
    } else {
      const token = await this.jwtService.signAsync({
        id: newUser.id,
        survey_id: surveyDescription.survey_description.id,
        schema_name: this.requestParams.tenant.schema_name,
        is_external: false,
      });

      let Mail = {
        to: data.email,
        subject: `Invitation to fill feedback survey | ${surveyDescription.survey_description.title}`,
        context: {
          link: `${this.config.get(
            "FE_URL"
          )}/survey/assessment/instructions/${token}`,
          username: data.name,
          logo: "cid:company-logo",
          surveyTitle: surveyDescription.survey_description.title,
          tenantName: this.requestParams.tenant.name,
          endDate: moment(surveyDescription.survey_description.end_date).format(
            "DD/MM/YY"
          ),
          ...defaultContext,
        },
        attachments: [
          {
            filename: "nbol-email-logo",
            path: "src/public/media/images/nbol-email-logo.png",
            cid: "company-logo",
          },
          ...defaultAttachments,
        ],
      };

      this.mailsService.SurveyMail(Mail);
    }

    return updatedSurvey;
  }

  async forceCompleteSurvey(body: any) {
    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          id: body.id,
        },
        include: [
          {
            model: Rater,
            include: [
              {
                model: SurveyRespondant,
                include: [
                  {
                    model: SurveyResponse,
                  },
                ],
              },
              {
                model: SurveyExternalRespondant,
                include: [
                  {
                    model: SurveyResponse,
                  },
                ],
              },
            ],
          },
        ],
      });

    const surveys = await this.survey
      .schema(this.requestParams.schema_name)
      .findAll({
        where: {
          survey_id: surveyDescription.id,
        },
        include: [
          {
            model: SurveyRespondant,
            include: [
              {
                model: Rater,
                where: {
                  category_name: {
                    [Op.ne]: "Self",
                  },
                },
              },
              {
                model: User,
              },
            ],
          },
          {
            model: SurveyExternalRespondant,
            include: [
              {
                model: Rater,
              },
            ],
          },
        ],
      });

    surveyDescription.surveys = surveys;

    const surveyids = surveys.map((item) => item.id);
    if (surveyDescription) {
      // let completed_survey = surveyDescription?.surveys?.reduce(
      //   (prev: any, curr: any) => {
      //     return curr.survey_respondants?.length > 0
      //       ? prev +
      //           curr?.survey_respondants?.reduce(
      //             (exrespprev: any, exrespcurr: any) => {
      //               console.log(exrespcurr.status, "STatus");

      //               return (
      //                 exrespprev +
      //                 (exrespcurr.status === SurveyStatus.Completed ? 1 : 0)
      //               );
      //             },
      //             0
      //           )
      //       : curr?.survey_external_respondants?.reduce(
      //           (respprev: any, respcurr: any) => {
      //             return (
      //               respprev +
      //               (respcurr.status === SurveyStatus.Completed ? 1 : 0)
      //             );
      //           },
      //           0
      //         );
      //   },
      //   0
      // );
      // console.log(completed_survey);
      const completed_survey = await this.hasCompletedStatus(surveyDescription);

      if (completed_survey) {
        const token = await {
          // id: respondants[index].respondant.id,
          survey_id: surveyDescription?.id,
          schema_name: this.requestParams.schema_name,
          is_external: false,
        };

        await surveyDescription.update({
          status: SurveyDescriptionStatus.Completed,
        });
        await this.survey.schema(this.requestParams.schema_name).update(
          {
            status: SurveyStatus.Completed,
          },
          {
            where: {
              survey_id: surveyDescription.id,
            },
          }
        );
        await this.surveyService.setBenchmark(
          surveyDescription.questionnaire_id,
          token
        );
        await this.setQuestionAvgGap(
          surveyDescription.questionnaire_id,
          token,
          surveyids
        );

        await this.reportsService.genrateReport(surveyDescription, token);
        return surveyDescription;
      } else {
        throw new BadRequestException(
          `For the Survey to be marked "Completed", at least one rater should have completed the survey assigned to him/her `
        );
      }
    }
  }

  async syncSurvey(body: any) {
    const surveyDescription = await this.surveyDescription
      .schema(this.requestParams.schema_name)
      .findOne({
        where: {
          id: body.id,
        },
        include: [
          {
            model: Rater,
            include: [
              {
                model: SurveyRespondant,
                include: [
                  {
                    model: SurveyResponse,
                  },
                ],
              },
              {
                model: SurveyExternalRespondant,
                include: [
                  {
                    model: SurveyResponse,
                  },
                ],
              },
            ],
          },
          {
            model: Survey,

            include: [
              {
                model: SurveyRespondant,
                include: [
                  {
                    model: Rater,
                  },
                  {
                    model: User,
                  },
                ],
              },
              {
                model: SurveyExternalRespondant,
                include: [
                  {
                    model: Rater,
                  },
                ],
              },
            ],
          },
        ],
      });

    if (surveyDescription) {
      let completed_survey = surveyDescription?.surveys?.reduce(
        (prev: number, curr: Survey) => {
          return curr.status === SurveyStatus.Completed ? prev + 1 : prev;
        },
        0
      );

      if (completed_survey === surveyDescription.total_assessments) {
        const token = await {
          // id: respondants[index].respondant.id,
          survey_id: surveyDescription?.id,
          schema_name: this.requestParams.schema_name,
          is_external: false,
        };
        // const token = await this.jwtService.signAsync({
        //   // id: respondants[index].respondant.id,
        //   survey_id: surveyDescription?.id,
        //   schema_name: this.requestParams.schema_name,
        //   is_external: false,
        // });
        // let surveyDescriptionBody = {};
        // surveyDescriptionBody["status"] = SurveyDescriptionStatus.Completed;
        // await this.tenantHistory.schema(DB_PUBLIC_SCHEMA).update(
        //   { type: TenantHistoryTypes.completed_survey },
        //   {
        //     where: { reference_id: surveyDescription.id },
        //   }
        // );
        await surveyDescription.update({
          status: SurveyDescriptionStatus.Completed,
        });
        // await this.surveyService.setBenchmark(
        //   surveyDescription.questionnaire_id,
        //   token
        // );
        // await this.setQuestionAvgGap(
        //   surveyDescription.questionnaire_id,
        //   token
        // );
        await this.reportsService.genrateReport(surveyDescription, token);
      } else {
        throw new BadRequestException(
          `For the Survey to be marked "Completed", at least one rater should have completed the survey assigned to him/her `
        );
      }
      return surveyDescription;
    }
  }

  async DownloadSingleSurveyProgress(id: string) {
    const surveyDescription = await SurveyDescription.schema(
      this.requestParams.schema_name
    ).findOne({
      where: {
        id,
        // end_date: {
        //   [Op.lt]: literal("current_date"),
        // },
      },
      include: [
        {
          model: Survey,
          include: [
            {
              model: User,
            },
            {
              model: SurveyRespondant,
              include: [
                {
                  model: Rater,
                },
                {
                  model: User,
                },
              ],
            },
            {
              model: SurveyExternalRespondant,
              include: [
                {
                  model: Rater,
                },
              ],
            },
          ],
        },
      ],
    });

    let rowValue = [
      "Client Name",
      "Survey Name",
      "Ratee Survey Status",
      "Ratee Name",
      "Rater Name",
      "Rater Category",
      "Survey Completed",
      "Completion Date",
    ];
    // for (const surveyDescription of surveyDescriptions) {
    let rowData2 = [];
    const workbook2 = new ExcelJS.Workbook();

    const sheet2 = workbook2.addWorksheet("Individual-Report", {
      views: [{ state: "frozen", ySplit: 1 }],
      pageSetup: {
        horizontalCentered: true,
        verticalCentered: true,
      },
    });
    rowData2.push(rowValue);

    for (const survey of surveyDescription.surveys) {
      if (survey.survey_respondants.length > 0) {
        for (const respodants of survey.survey_respondants) {
          rowData2.push([
            this.requestParams?.schema_name,
            surveyDescription?.title,
            survey?.status,
            survey?.employee?.name,
            respodants?.respondant?.name,
            respodants?.rater?.category_name,
            respodants.status === "Completed" ? "Y" : "N",
            respodants.status === "Completed" ? respodants.updatedAt : "-",
          ]);
        }
      }
      if (survey.survey_external_respondants.length > 0) {
        for (const respodants of survey.survey_external_respondants) {
          rowData2.push([
            this.requestParams?.schema_name,
            surveyDescription?.title,
            survey.status,
            survey?.employee?.name,
            respodants?.respondant_name,
            respodants?.rater?.category_name,
            respodants.status === "Completed" ? "Y" : "N",
            respodants.status === "Completed" ? respodants.updatedAt : "-",
          ]);
        }
      }
    }
    rowData2.forEach((row) => {
      sheet2.addRow(row);
    });
    sheet2.columns.forEach((column) => {
      column.width = 30; // Adjust the desired width here
    });
    sheet2.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFF00" },
      bgColor: { argb: "FF00FF00" },
    };
    var formattedTitle = surveyDescription.title.replace(/ /g, "-");
    await workbook2.xlsx.writeFile(
      `./src/public/media/excels/${formattedTitle}.xlsx`
    );
    rowData2.length = 0;
    return {
      message: `/media/excels/${formattedTitle}.xlsx`,
      format: null,
      data: null,
      surveyDescription_id: null,
    };
    // }
  }

  hasCompletedStatus = (surveyDescription: any) => {
    // for (const survey of surveyDescription.surveys) {
    //   if (survey.survey_respondants.length > 0) {
    //     const checkStatus = survey.survey_respondants.some(
    //       (respodants) => respodants.status === SurveyStatus.Completed
    //     );
    //     // for (const respodants of survey.survey_respondants) {
    //     //   // if (respodants.status === SurveyStatus.Completed) {
    //     //   return respodants.status === SurveyStatus.Completed ? true : false;
    //     //   // }
    //     // }
    //     return checkStatus;
    //   }
    //   if (survey.survey_external_respondants.length > 0) {
    //     // for (const respodants of survey.survey_external_respondants) {
    //     //   return respodants.status === SurveyStatus.Completed ? true : false;
    //     // }
    //   }
    // }
    const checkStatus = surveyDescription.surveys.every((survey) => {
      return survey.survey_respondants.length > 0
        ? survey.survey_respondants.some(
            (respodants) => respodants.status === SurveyStatus.Completed
          )
        : survey.survey_external_respondants.some(
            (respodants) => respodants.status === SurveyStatus.Completed
          );
    });
    return checkStatus;
  };
}
