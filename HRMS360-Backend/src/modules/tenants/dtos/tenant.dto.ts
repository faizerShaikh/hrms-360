import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { AdminTypeOptions } from "../types";
import { ResponseFormOptions } from "src/modules/surveys/type";

export class TenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  schema_name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  industry_id: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  no_of_employee: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  tenure: number;

  @IsString()
  @IsNotEmpty()
  start_date: string;

  @IsString()
  @IsNotEmpty()
  end_date: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

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

  @IsString()
  @IsOptional()
  response_form?: ResponseFormOptions;
}
