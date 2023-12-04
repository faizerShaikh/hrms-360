import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Department } from "src/modules/settings/modules/department/models";
import { Designation } from "src/modules/settings/modules/designation/models";
import { TenantMetaData, TenantUser } from "src/modules/tenants/models";
import { User } from "../models";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      TenantUser,
      Department,
      Designation,
      TenantMetaData,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UsersModule {}
