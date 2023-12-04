import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ScheduleModule } from "@nestjs/schedule";
import { CronjobService } from "./cronjob.service";
import { GlobalJwtModule } from "../globalJwt";

@Module({
  imports: [ScheduleModule.forRoot(), GlobalJwtModule],
  providers: [CronjobService, JwtService],
})
export class CronjobModule {}
