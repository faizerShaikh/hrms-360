import { Type } from "class-transformer";
import {
  IsDefined,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { TenantDto } from "./tenant.dto";
import { TenantUserDto } from "./tenantUser.dto";

export class CreateTenant {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => TenantDto)
  tenant: TenantDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TenantUserDto)
  user: TenantUserDto;
}
