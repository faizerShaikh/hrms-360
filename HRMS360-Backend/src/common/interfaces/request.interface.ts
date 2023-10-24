import { Request } from "express";
import { Tenant } from "src/modules/tenants/models";
import { ApsisUser } from "src/modules/apsis/module/apsisUser/model";
import { User } from "src/modules/users/models";
import { Transaction } from "sequelize";

export interface RequestInterface extends Request {
  tenant?: Tenant;
  user?: User | ApsisUser;
  is_apsis_user?: boolean;
  transaction?: Transaction;
}
