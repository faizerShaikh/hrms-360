import { Injectable } from "@nestjs/common";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { getSearchObject } from "src/common/helpers";
import { RequestParamsService } from "src/common/modules";
import { GenericsService } from "src/modules/generics/app/generics.service";
import { Industry } from "../models";

@Injectable()
export class IndustryService extends GenericsService {
  constructor(private readonly requestParams: RequestParamsService) {
    super(Industry.schema(DB_PUBLIC_SCHEMA), {
      requestParams,
      searchFields: ["name"],
    });
  }

  getAll() {
    return Industry.schema(DB_PUBLIC_SCHEMA).findAndCountAll({
      where: {
        tenant_id: this.requestParams.getTenant().id,
        ...getSearchObject(this.requestParams.query, ["name"]),
      },
      ...this.requestParams.pagination,
    });
  }

  getAllIndustryForApsisAdmin() {
    return Industry.schema(DB_PUBLIC_SCHEMA).findAndCountAll({
      where: {
        tenant_id: null,
        ...getSearchObject(this.requestParams.query, ["name"]),
      },
      ...this.requestParams.pagination,
    });
  }
}
