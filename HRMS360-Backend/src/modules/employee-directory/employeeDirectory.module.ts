import { Module } from "@nestjs/common";
import { EmployeeModule } from "./employees/app/employee.module";

@Module({
  imports: [EmployeeModule],
})
export class EmployeeDirectoryModule {}
