import { IsEmail, IsString } from "class-validator";

export class CreateEmployeeDTO {
  @IsString()
  name: string;

  @IsString()
  fathers_name: string;

  @IsString()
  mothers_name: string;

  @IsEmail()
  email: string;
}
