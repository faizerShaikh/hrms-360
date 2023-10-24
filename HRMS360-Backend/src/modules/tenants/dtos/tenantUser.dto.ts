import { PartialType } from "@nestjs/mapped-types";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class TenantUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  region: string;

  @IsOptional()
  password?: string;

  @IsOptional()
  tenant_id?: string;
}

export class UpdateTenatUserDto extends PartialType(TenantUserDto) {}
