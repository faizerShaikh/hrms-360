import * as exphbs from "express-handlebars";
import * as moment from "moment";
import { join } from "path";

export const handlebars = () => {
  const helpers = {
    getFormattedDate: (value: string) => {
      return moment(value).format("DD/MM/YYYY");
    },
    log: (value) => {
      console.log("---------------------", value, "---------------------");
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

      const ratersName =
        comment!.survey_respondent && comment!.survey_respondent!.rater
          ? comment!.survey_respondent!.rater!.catName
          : comment!.survey_external_respondent &&
            comment!.survey_external_respondent!.rater &&
            comment!.survey_external_respondent!.rater!.catName;
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
    getObjValue: (obj: any, key: any) => {
      return obj[key];
    },
  };
  const hbs = exphbs.create({
    helpers: {},
    layoutsDir: join(__dirname, "../../../src/public", "report"),
    partialsDir: join(__dirname, "../../../src/public/report", "partials"),
    extname: ".hbs",
    defaultLayout: "base",
  });

  for (const [key, value] of Object.entries(helpers)) {
    hbs.helpers[key] = value;
  }
  return hbs;
};
