import { getCookie } from "cookies-next";
import { NextPageContext } from "next";

export const getSubDomain = (ctx?: NextPageContext) => {
  if (ctx) {
    return getCookie("schema_name", { req: ctx.req, res: ctx.res });
  } else {
    return getCookie("schema_name");
  }
};
