import * as exphbs from "express-handlebars";
import * as moment from "moment";
import { join } from "path";
import { SurveyRespondantStatus } from "src/modules/surveys/type";
export const helpers = {
  getFormatedDate: (value: string) => {
    return moment(value).format("DD/MM/YYYY");
  },

  log: (value) => {
    console.log("---------------------", value, "---------------------");
  },

  ifEquals: (arg1, arg2, options) => {
    return arg1 == arg2 ? options.fn(this) : options.inverse(this);
  },

  decimalUpto2digit: (value) => {
    let newValue = parseFloat(value).toFixed(2);

    return newValue;
  },

  calculate: (value) => {

    return (value * 100) / 4;
  },

  CompletionPercentage: (completed, total) => {
    return `${((completed * 100) / total).toFixed(2)}%`;
  },

  findIndexofText: (individualQuestionData: any, id: any) => {
    let index = individualQuestionData.findIndex((obj: any) => obj.id === id);

    return index + 1;
  },

  NBOLCompositeReports: (data, per) => {
    let completed_count = 0;
    if (data.length) {
      for (const item of data) {
        if (item.status === SurveyRespondantStatus.Completed) {
          completed_count++;
        }
      }
    }
    return per
      ? `${
          isNaN((completed_count / data.length) * 100)
            ? 0
            : ((completed_count / data.length) * 100).toFixed(2)
        }%`
      : completed_count;
  },

  CompletedResponseStatus: (data, per) => {
    let completed_count = 0;
    if (data.length) {
      for (const item of data) {
        if (item.status === SurveyRespondantStatus.Completed) {
          completed_count++;
        }
      }
    }
    return per
      ? `${
          isNaN((completed_count / data.length) * 100)
            ? 0
            : ((completed_count / data.length) * 100).toFixed(2)
        }%`
      : completed_count;
  },

  PendingResponseStatus: (data, per) => {
    let pending_count = 0;
    if (data.length) {
      for (const item of data) {
        if (item.status === SurveyRespondantStatus.Ongoing) {
          pending_count++;
        }
      }
    }

    return per
      ? `${
          isNaN((pending_count / data.length) * 100)
            ? 0
            : ((pending_count / data.length) * 100).toFixed(2)
        }%`
      : pending_count;
  },

  StatusByCompletion: (data, position) => {
    let completed_count = 0;
    let inprogress_count = 0;
    let notstarted_count = 0;
    if (data.length) {
      for (const item of data) {
        if (item.status === SurveyRespondantStatus.Completed) {
          completed_count++;
        }
        if (
          item.status === SurveyRespondantStatus.Ongoing &&
          item.survey_responses.length > 0
        ) {
          inprogress_count++;
        }
        if (
          item.status === SurveyRespondantStatus.Ongoing &&
          item.survey_responses.length == 0
        ) {
          notstarted_count++;
        }
      }
    }
    return position.hash.position === 1
      ? completed_count
      : position.hash.position === 2
      ? inprogress_count
      : notstarted_count;
  },

  StatusByCompletionPercenatge: (data, position) => {
    let completed_count = 0;
    let inprogress_count = 0;
    let notstarted_count = 0;
    if (data.length) {
      for (const item of data) {
        if (item.status === SurveyRespondantStatus.Completed) {
          completed_count++;
        }
        if (
          item.status === SurveyRespondantStatus.Ongoing &&
          item.survey_responses.length > 0
        ) {
          inprogress_count++;
        }
        if (
          item.status === SurveyRespondantStatus.Ongoing &&
          item.survey_responses.length == 0
        ) {
          notstarted_count++;
        }
      }
    }

    return position.hash.position === 1
      ? `${
          (completed_count / data.length) * 100
            ? (completed_count / data.length) * 100
            : 0
        }%`
      : position.hash.position === 2
      ? `${
          (inprogress_count / data.length) * 100
            ? (inprogress_count / data.length) * 100
            : 0
        }%`
      : `${
          (notstarted_count / data.length) * 100
            ? (notstarted_count / data.length) * 100
            : 0
        }%`;
  },
  FeedbackPercentage: (completed, total) => {
    return `${(100 - (completed * 100) / total).toFixed(2)}%`;
  },
  isSameCompetency: (
    index: number,
    currTitle: string,
    questions: any,
    options: any
  ) => {
    if (index === 0) {
      return options.fn(this);
    }
    let lastTitle = questions[index - 1].competency.title;

    return currTitle.toLocaleLowerCase() !== lastTitle.toLocaleLowerCase()
      ? options.fn(this)
      : options.inverse(this);
  },
  getRaterName: (comment: any) => {
    if (comment?.survey_respondent) {
      return comment?.survey_respondent!.rater!.catName;
    } else if (comment?.survey_external_respondent) {
      return comment?.survey_external_respondent!.rater!.catName;
    }
  },
  isSameRater: (index: number, comment: any, comments: any, options: any) => {
    if (index === 0) {
      return options.fn(this);
    }

    const ratersName = comment!.survey_respondent
      ? comment!.survey_respondent!.rater!.catName
      : comment!.survey_external_respondent
      ? comment!.survey_external_respondent!.rater!.catName
      : "-";
    let lastRaterName = "";
    if (comments[index - 1]!.survey_respondent) {
      lastRaterName = comments[index - 1]!.survey_respondent!.rater!.catName;
    } else {
      lastRaterName =
        comments[index - 1]!.survey_external_respondent!.rater!.catName;
    }

    return lastRaterName !== ratersName
      ? options.fn(this)
      : options.inverse(this);
  },
  isSameRepondent: (
    index: number,
    surveyRespondant: any,
    surveyRespondants: any,
    options: any
  ) => {
    if (index === 0) {
      return options.fn(this);
    }
    const curr = surveyRespondant.rater.category_name;
    const last = surveyRespondants[index - 1].rater.category_name;
    return curr !== last ? options.fn(this) : options.inverse(this);
  },
  isEqual: (val1: any, val2: any, options: any) => {
    return val1 === val2.toLocaleLowerCase()
      ? options.fn(this)
      : options.inverse(this);
  },
  concat: (...args) => {
    return args.reduce((prev, curr) =>
      ["string", "number"].includes(typeof curr) ? prev + curr : prev
    );
  },
  renderRows: (raters: string[], response: any) => {
    let rows = "";
    raters.forEach((raters) => {
      rows += `<td class="text-center py-[5px] text-[10px] text-[#242424] border-b-0 aller">${
        response[raters] || 0
      }</td>`;
    });
    return rows;
  },
  getObjValue: (obj: any, key: any, isIndividualreport: any) => {
    const value = JSON.parse(obj[key]);

    if (isIndividualreport) {
      // if (key === "R") {
      return obj[key] === 0 ? "-" : value;
      // } else {
      //   return value.toFixed(2);
      // }
    } else {
      // if (key === "R") {
      return Math.round(value);
      // } else {
      //   return Math.floor(value);
      // }
    }
  },
};
export const handlebars = () => {
  const hbs = exphbs.create({
    helpers,
    layoutsDir: join(__dirname, "../../../src/public", "report"),
    partialsDir: join(__dirname, "../../../src/public/report", "partials"),
    extname: ".hbs",
    defaultLayout: "base",
  });
  return hbs;
};
