import moment from "moment";

export function getFormattedDate(date: string, time: boolean = false) {
  return moment(date).format(time ? "DD/MM/YYYY HH:MM" : "DD/MM/YYYY");
}
