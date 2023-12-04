import { PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { ResponseFormOptions } from "src/modules/surveys/type";
import { TenantDto, TenantUserDto } from "./index";

export class TenantUserUpdate extends PartialType(TenantUserDto) {}
export class TenantUpdate extends PartialType(TenantDto) {}

export class UpdateTenant {
  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => TenantUpdate)
  tenant: TenantUpdate;

  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => TenantUserUpdate)
  user: TenantUserUpdate;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  response_form?: ResponseFormOptions;
}
