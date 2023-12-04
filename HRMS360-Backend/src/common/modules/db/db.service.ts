import { BadRequestException, Inject, Injectable, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import {
  SequelizeModuleOptions,
  SequelizeOptionsFactory,
} from "@nestjs/sequelize";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { RequestInterface } from "src/common/interfaces/request.interface";
import { databaseConfig } from "src/config";
import { publicTables, schemaTables } from "./models";

let paths = [
  "/media(.*)",
  // "/api/v1/tenant(.*)",
  // "/api/v1/auth(.*)",
  // "/api/v1/survey/detail(.*)",
  // "/api/v1/survey/multiple-detail(.*)",
  // "/api/v1/survey/submit-survey(.*)",
  // "/api/v1/survey/submit-survey-single-ratee(.*)",
  // "/api/v1/reports/pdf/(.*)",
  // "/api/v1/channel-partner/(.*)",
  // "/api/v1/standard-competency/(.*)",
];

@Injectable({ scope: Scope.REQUEST })
export class DBService implements SequelizeOptionsFactory {
  constructor(
    @Inject(REQUEST) private readonly request: RequestInterface,
    private readonly jwtService: JwtService
  ) {}

  async createSequelizeOptions(): Promise<SequelizeModuleOptions> {
    let schema_name = this.request.headers["x-tenant-name"];
    let schema = DB_PUBLIC_SCHEMA;
    if (this.request.baseUrl === "/api/v1/survey/submit-survey-single-ratee") {
      const token: any = await this.jwtService.decode(this.request.body.token);

      if (!token.schema_name) throw new BadRequestException("Token not found!");
      schema = token.schema_name;
    } else if (this.request.baseUrl === "/api/v1/survey/submit-survey") {
      const token: any = await this.jwtService.decode(this.request.body.token);

      if (!token.schema_name) throw new BadRequestException("Token not found!");
      schema = token.schema_name;
    } else {
      if (typeof schema_name === "string") {
        schema = schema_name;
      }

      if (paths.some((path) => new RegExp(path).test(this.request.baseUrl))) {
        schema = "public";
      }
    }

    return {
      ...databaseConfig[process.env.NODE_ENV || "development"],
      schema,
      logging: false,
      models: [...publicTables, ...schemaTables],
    };
  }
}
