import { Exclude } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsBoolean()
  @IsNotEmpty()
  is_lm_approval_required: boolean;

  @IsBoolean()
  @IsNotEmpty()
  is_active: boolean;

  @IsString()
  @IsOptional()
  line_manager_id: CreateUserDto;

  @IsString()
  @IsOptional()
  secondary_line_manager_id: string;

  @IsString()
  @IsNotEmpty()
  department_id: string;

  @IsString()
  @IsNotEmpty()
  designation_id: string;

  @Exclude()
  password?: string;

  @IsOptional()
  id?: string;
}
