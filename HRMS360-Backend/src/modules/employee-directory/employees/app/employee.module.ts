import { Module } from "@nestjs/common";
import { EmployeeController } from "./employee.controller";
import { EmployeeService } from "./employee.service";

@Module({
  providers: [EmployeeController, EmployeeService],
})
export class EmployeeModule {}
