import { Injectable } from "@nestjs/common";
import { RequestParamsService } from "src/common/modules";
import { GenericsService } from "src/modules/generics/app/generics.service";
import { ResponseGroup } from "../models";

@Injectable()
export class ResponseGroupService extends GenericsService {
  constructor(private readonly requestParams: RequestParamsService) {
    super(ResponseGroup.schema(requestParams.schema_name), {
      requestParams,
      searchFields: ["title"],
    });
  }
}
