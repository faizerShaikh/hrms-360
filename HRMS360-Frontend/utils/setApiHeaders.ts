import { API, serverAPI } from "configs/api";
import { getCookie } from "cookies-next";
import { NextPageContext } from "next";

export const setApiHeaders = (ctx?: NextPageContext) => {
  let token;

  let subDomain;
  if (typeof ctx === "object") {
    token = getCookie("token", { req: ctx?.req, res: ctx.res });
    subDomain = getCookie("schema_name", { req: ctx?.req, res: ctx.res });

    if (!subDomain) {
      let tenant = getCookie("tenant", {
        req: ctx?.req,
        res: ctx.res,
      }) as string;
      if (typeof tenant === "string" && tenant) {
        subDomain = JSON.parse(tenant)?.schema_name;
      }
    }
  } else {
    token = getCookie("token");
    subDomain = getCookie("schema_name");

    if (!subDomain) {
      let tenant = getCookie("tenant") as string;
      if (typeof tenant === "string" && tenant) {
        subDomain = JSON.parse(tenant)?.schema_name;
      }
    }
  }

  if (token) {
    API.defaults.headers.common["authorization"] = `Bearer ${token}`;
    serverAPI.defaults.headers.common["authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["authorization"];
    delete serverAPI.defaults.headers.common["authorization"];
  }
  if (subDomain) {
    API.defaults.headers.common["x-tenant-name"] = subDomain;
    serverAPI.defaults.headers.common["x-tenant-name"] = subDomain;
  } else {
    delete API.defaults.headers.common["x-tenant-name"];
    delete serverAPI.defaults.headers.common["x-tenant-name"];
  }
};
