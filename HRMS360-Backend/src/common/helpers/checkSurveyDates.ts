// import { SurveyDescriptionStatus } from "src/modules/surveys/type";

// export const checkForDates = () => {
//     const currentDate =
//       new Date().toISOString().slice(0, 10) +
//       "T" +
//       new Date().toISOString().slice(11, 19);
//     console.log(currentDate, "Current DATe");

//     const surveys = await this.surveyDescription.findAll({
//       where: {
//         // [Op.or]:[
//         // {
//         lm_approval_cut_off_date: {
//           [Op.lt]: literal(
//             `CONCAT(DATE(lm_approval_cut_off_date), 'T', TIME(lm_approval_cut_off_date)) < '${currentDate}'`
//           ),
//         },
//         // },
//         //   {

//         //   }
//         // ],
//         status: {
//           [Op.in]: [
//             SurveyDescriptionStatus.In_Progress,
//             SurveyDescriptionStatus.Initiated,
//           ],
//         },
//       },
//       include: [
//         {
//           model: Survey,
//         },
//       ],
//     });

//     console.log(surveys, "surveys");

//     const required_arr = surveys.filter((item) => {
//       const currentDate =
//         new Date().toISOString().slice(0, 10) +
//         "T" +
//         new Date().toISOString().slice(11, 19);
//       const lm_date = new Date(item.lm_approval_cut_off_date);
//       const respondant_date = new Date(item.respondant_cut_off_date);

//       return (
//         moment(lm_date).isBefore(currentDate) ||
//         moment(respondant_date).isBefore(currentDate)
//       );
//     });
//     // for (const survey of surveys) {
//     //   await survey.update({
//     //     status: SurveyDescriptionStatus.Onhold,
//     //   });
//     // }
//     // if (surveys.length > 0) {
//     //   await this.survey.update(
//     //     { status: SurveyStatus.Onhold },
//     //     { where: { survey_id: surveys.map((item) => item.id) } }
//     //   );
//     // }
