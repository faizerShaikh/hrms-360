import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { SequelizeModule } from "@nestjs/sequelize";
import { TenantUser } from "src/modules/tenants/models";
import { ApsisUser } from "src/modules/apsis/module/apsisUser/model";
import { User } from "src/modules/users/models";
import { jwtFactory } from "../jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    JwtModule.registerAsync({ ...jwtFactory }),
    SequelizeModule.forFeature([ApsisUser, TenantUser, User]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
