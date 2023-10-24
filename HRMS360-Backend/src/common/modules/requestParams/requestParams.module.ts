import { Global, Module } from "@nestjs/common";
import { RequestParamsService } from "./requestParams.service";

@Global()
@Module({
  exports: [RequestParamsService],
  providers: [RequestParamsService],
})
export class RequestParamsModule {}
