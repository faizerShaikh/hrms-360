import { Injectable } from "@nestjs/common";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { RequestParamsService } from "src/common/modules";
import { GenericsService } from "src/modules/generics/app/generics.service";
import { ApsisUser } from "../model";

@Injectable()
export class ApsisUserService extends GenericsService {
  constructor(private readonly requestParams: RequestParamsService) {
    super(ApsisUser.schema(DB_PUBLIC_SCHEMA), {
      requestParams,
    });
  }
}
