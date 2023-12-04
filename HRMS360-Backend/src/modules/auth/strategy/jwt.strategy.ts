import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { RequestInterface } from "src/common/interfaces/request.interface";
import { AuthService } from "../app/auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: "Bismillah@123",
      passReqToCallback: true,
    });
  }

  async validate(request: RequestInterface, payload: any) {
    let user = await this.authService.getUser(payload);

    if (!user) throw new UnauthorizedException("Unauthorized user");
    request;

    return user;
  }
}
