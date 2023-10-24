import { Module } from "@nestjs/common";
import { DesignationController } from "./designation.controller";
import { DesignationService } from "./designation.service";

@Module({
  imports: [],
  controllers: [DesignationController],
  providers: [DesignationService],
})
export class DesignationModule {}
