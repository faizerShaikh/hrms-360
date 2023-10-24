import { RaterService } from "./rater.service";
import { Module } from "@nestjs/common";
import { RaterController } from "./rater.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { Rater } from "../models";

@Module({
  imports: [SequelizeModule.forFeature([Rater])],
  controllers: [RaterController],
  providers: [RaterService],
})
export class RaterModule {}
