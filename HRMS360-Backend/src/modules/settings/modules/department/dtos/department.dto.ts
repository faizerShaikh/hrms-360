import { IsNotEmpty, IsString } from "class-validator";

export class DepartmentDTO {
  @IsString()
  @IsNotEmpty()
  name: string;
}
