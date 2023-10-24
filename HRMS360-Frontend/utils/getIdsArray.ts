export const getIdsArray = (data: any[], field: string = "id"): string[] => {
  return data.map((item) => item[field]);
};
