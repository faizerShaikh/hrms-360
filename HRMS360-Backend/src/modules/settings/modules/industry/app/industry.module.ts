import { IndustryService } from "./industry.service";
import { IndustryController } from "./industry.controller";
import { Module } from "@nestjs/common";

@Module({
  imports: [],
  controllers: [IndustryController],
  providers: [IndustryService],
})
export class IndustryModule {}
