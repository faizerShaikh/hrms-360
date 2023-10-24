import { DepartmentService } from "./department.service";
import { DepartmentController } from "./department.controller";
import { Module } from "@nestjs/common";

@Module({
  imports: [],
  controllers: [DepartmentController],
  providers: [DepartmentService],
})
export class DepartmentModule {}
