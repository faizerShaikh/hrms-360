import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { Response } from "express";
import { InjectModel } from "@nestjs/sequelize";
import { RequestInterface } from "../interfaces/request.interface";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { TenantUser } from "src/modules/tenants/models";
import { DB_PUBLIC_SCHEMA } from "../constants";

@Injectable()
export class ChannelPartnerAuth implements NestMiddleware {
  constructor(
    @InjectModel(TenantUser) private readonly tenantUser: typeof TenantUser,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async use(req: RequestInterface, _: Response, next: Function) {
    if (!req.tenant.is_channel_partner)
      throw new UnauthorizedException("Unauthorized user");

    let token = req.headers.authorization?.split(" ")[1];

    if (!token) throw new UnauthorizedException("Unauthorized user");

    let payload: any = this.jwtService.verify(token, this.config.get("JWTKEY"));

    let user = await this.tenantUser.schema(DB_PUBLIC_SCHEMA).findOne({
      where: {
        id: payload.id,
      },
      attributes: {
        exclude: ["password"],
      },
    });
    if (!user) throw new UnauthorizedException("Unauthorized user");

    req.user = user;

    next();
  }
}
