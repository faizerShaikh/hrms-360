import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { TenantUser } from "src/modules/tenants/models";
import { ApsisUser } from "src/modules/apsis/module/apsisUser/model";
import { User } from "src/modules/users/models";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "../strategy";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    SequelizeModule.forFeature([ApsisUser, TenantUser, User]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
