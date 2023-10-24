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
import { ApsisUser } from "src/modules/apsis/module/apsisUser/model";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(TenantUser) private readonly user: typeof TenantUser,
    @InjectModel(ApsisUser) private readonly apsisUser: typeof ApsisUser,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async use(req: RequestInterface, _: Response, next: Function) {
    let token: any = req.headers.authorization?.split(" ")[1];

    if (!token) throw new UnauthorizedException("Unauthorized user");

    let payload: any = this.jwtService.verify(token, this.config.get("JWTKEY"));

    let user;

    if (payload?.is_apsis_user) {
      user = await this.apsisUser.schema(DB_PUBLIC_SCHEMA).findOne({
        where: {
          id: payload.id,
        },
        attributes: {
          exclude: ["password"],
        },
      });
      req.is_apsis_user = true;
    } else {
      user = await this.user.schema(DB_PUBLIC_SCHEMA).findOne({
        where: {
          id: payload.id,
        },
        attributes: {
          exclude: ["password"],
        },
      });
    }
    if (!user) throw new UnauthorizedException("Unauthorized user");

    req.user = user;
    next();
  }
}
