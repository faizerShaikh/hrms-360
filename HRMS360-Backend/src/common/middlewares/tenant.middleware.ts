import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { Response } from "express";
import { Sequelize } from "sequelize-typescript";
import { Tenant } from "src/modules/tenants/models";
import { DB_PUBLIC_SCHEMA, publicModels } from "../constants";
import { RequestInterface } from "../interfaces/request.interface";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(Tenant) private readonly tenant: typeof Tenant,
    @InjectConnection() private readonly sequelize: Sequelize
  ) {}
  async use(req: RequestInterface, _: Response, next: Function) {
    if (req.is_apsis_user) {
      return next();
    }

    let schema_name = req.headers["x-tenant-name"] || "epf";
    // console.log(req.headers, "HEADERS");

    if (!schema_name)
      throw new UnauthorizedException("Please provide a tenant name");

    const tenant = await this.tenant.schema(DB_PUBLIC_SCHEMA).findOne({
      where: {
        schema_name,
      },
    });

    if (!tenant) throw new NotFoundException("Tenant not found");

    if (!tenant.is_active)
      throw new BadRequestException("Tenant is not active");

    req.tenant = tenant;
    next();
  }
}
