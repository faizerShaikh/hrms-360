import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { AdminTypeOptions } from "../types";

export class TenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  schema_name: string;

  @IsString()
  @IsOptional()
  location: string;

  @IsString()
  @IsOptional()
  industry_id: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  no_of_employee: number;

  @IsOptional()
  @IsNumber()
  tenure: number;

  @IsString()
  @IsOptional()
  start_date: string;

  @IsString()
  @IsOptional()
  company_registration_number: string;

  @IsString()
  @IsOptional()
  end_date: string;

  @IsBoolean()
  @IsOptional()
  is_active: boolean;

  @IsBoolean()
  @IsOptional()
  is_channel_partner?: boolean;

  @IsBoolean()
  @IsOptional()
  is_own_schema?: boolean;

  @IsString()
  @IsOptional()
  parent_tenant_id?: string;

  @IsOptional()
  admin_type?: AdminTypeOptions;

  @IsBoolean()
  @IsOptional()
  is_lm_approval_required?: boolean;
}
