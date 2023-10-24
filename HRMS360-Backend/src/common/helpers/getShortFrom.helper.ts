export const getShortFrom = (str: string) => {
  if (str.split(" ").length > 1) {
    var matches = str.match(/\b(\w)/g);
    return matches.join("");
  } else {
    return str;
  }
};
