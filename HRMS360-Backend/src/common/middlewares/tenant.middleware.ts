import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Response } from "express";
import { Tenant } from "src/modules/tenants/models";
import { DB_PUBLIC_SCHEMA } from "../constants";
import { RequestInterface } from "../interfaces/request.interface";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(Tenant) private readonly tenant: typeof Tenant,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}
  async use(req: RequestInterface, _: Response, next: Function) {
    let token: any = req.headers.authorization?.split(" ")[1];
    let payload: any = token
      ? this.jwtService.verify(token, this.config.get("JWTKEY"))
      : null;

    if (payload && payload?.is_apsis_user) {
      return next();
    }
    let schema_name = req.headers["x-tenant-name"];

    if (!schema_name)
      throw new UnauthorizedException("Please provide a tenant name");

    const tenant = await this.tenant.schema(DB_PUBLIC_SCHEMA).findOne({
      where: {
        schema_name,
      },
    });

    if (!tenant) throw new NotFoundException("Tenant not found");

    if (!tenant.is_active)
      throw new BadRequestException(
        "Tenant is not active, please activate or get in touch with admin!"
      );
    req.tenant = tenant;
    next();
  }
}
