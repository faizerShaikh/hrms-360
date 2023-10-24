export function escapeRegExp(value: string) {
  return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
export const searchData = (data: any, text: string) => {
  const searchRegex = new RegExp(escapeRegExp(text.trim()), "i");
  if (data) {
    if ("rows" in data) {
      return data.rows.filter((row: any) => {
        return Object.keys(row).some((field) => {
          return row[field] ? searchRegex.test(row[field].toString()) : null;
        });
      });
    }

    return data.filter((row: any) => {
      return Object.keys(row).some((field) => {
        return row[field] ? searchRegex.test(row[field].toString()) : null;
      });
    });
  }
};
