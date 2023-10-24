import { getCookie } from "cookies-next";
import { NextPageContext } from "next";

export const getParsedCookie = <T = any>(
  name: string,
  ctx?: NextPageContext
): T | null => {
  try {
    let data: T;
    if (ctx) {
      data = JSON.parse(
        getCookie(name, { req: ctx.req, res: ctx.res }) as string
      ) as T;
    } else {
      data = JSON.parse(getCookie(name) as string) as T;
    }
    if (data) {
      return data;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};
