import { UserInterface } from "interfaces/users";
import { BaseObjInterface, IndustryInterface } from "..";

export interface TenentInterface extends BaseObjInterface {
  name: string;
  schema_name: string;
  location: string;
  no_of_employee: number;
  no_of_employee_created?: number;
  tenure: number;
  start_date: string;
  end_date: string;
  is_active?: boolean;
  is_channel_partner?: boolean;
  is_own_schema?: boolean;
  parent_tenant_id?: string;
  industry?: IndustryInterface;
  admin?: UserInterface;
  is_lm_approval_required?: boolean;
  tenant_pic?: string;
  admin_type: string;
  tenantMetaData?: {
    id?: string;
    response_form?: string;
  };
}
