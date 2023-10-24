import { Module } from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ScheduleModule } from "@nestjs/schedule";
import { jwtFactory } from "src/modules/auth/jwt";
import { CronjobService } from "./cronjob.service";

@Module({
  imports: [
    JwtModule.registerAsync({ ...jwtFactory }),
    ScheduleModule.forRoot(),
  ],
  providers: [CronjobService, JwtService],
})
export class CronjobModule {}
