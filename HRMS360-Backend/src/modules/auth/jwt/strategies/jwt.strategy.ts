import { Injectable, Scope, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/sequelize";
import { TenantUser } from "src/modules/tenants/models";

@Injectable({ scope: Scope.REQUEST })
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    configService: ConfigService,
    @InjectModel(TenantUser) private readonly user: typeof TenantUser
  ) {
    super({
      secretOrKey: configService.get("JWTKEY"),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: any): Promise<TenantUser> {
    const user = await this.user.findOne({
      where: {
        id: payload.id,
      },
      attributes: {
        exclude: ["password"],
      },
    });

    if (!user) throw new UnauthorizedException();

    return user;
  }
}
