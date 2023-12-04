import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { QuestionResponse } from "src/modules/competencies/modules/questions/models";
import { StandardResponseController } from "./standardResponse.controller";
import { StandardResponseService } from "./standardResponse.service";

@Module({
  imports: [SequelizeModule.forFeature([QuestionResponse])],
  controllers: [StandardResponseController],
  providers: [StandardResponseService],
})
export class StandardResponseModule {}
