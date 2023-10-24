import { Injectable } from "@nestjs/common";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { RequestParamsService } from "src/common/modules";
import { GenericsService } from "src/modules/generics/app/generics.service";
import { Industry } from "../models";

@Injectable()
export class IndustryService extends GenericsService {
  constructor(private readonly requestParams: RequestParamsService) {
    super(Industry.schema(DB_PUBLIC_SCHEMA), {
      requestParams,
      searchFields: ["name"],
      defaultWhere: {
        tenant_id: requestParams.is_apsis_user ? null : requestParams.tenant.id,
      },
    });
  }
}
