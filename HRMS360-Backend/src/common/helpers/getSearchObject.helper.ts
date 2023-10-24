import { Op } from "sequelize";

export const getSearchObject = (
  text: string,
  fieldList: Array<string>
): any => {
  if (text) {
    let query = {};

    for (const field of fieldList) {
      query[`$${field}$`] = {
        [Op.iLike]: `%${text.trim().replace(/%20/g, " ")}%`,
      };
    }
    return { [Op.or]: query };
  }
  return {};
};
