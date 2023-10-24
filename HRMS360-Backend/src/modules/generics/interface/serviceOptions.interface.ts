import { Includeable, WhereOptions } from "sequelize";
import { RequestParamsService } from "src/common/modules";

export interface ServiceOptions {
  include?: Includeable | Includeable[];
  isSoftDelete?: boolean;
  defaultWhere?: WhereOptions;
  requestParams?: RequestParamsService;
  searchFields?: Array<string>;
}
