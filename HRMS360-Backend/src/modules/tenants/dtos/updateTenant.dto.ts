import { PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { IsObject, IsOptional, ValidateNested } from "class-validator";
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
}
