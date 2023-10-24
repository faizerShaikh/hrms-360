import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { CreateStandardResponse, UpdateStandardResponse } from "../dtos";
import { StandardResponseService } from "./standardResponse.service";

@Controller("setting/standard-response")
export class StandardResponseController {
  constructor(
    private readonly standardResponseService: StandardResponseService
  ) {}

  @Post()
  createStandardResponse(@Body() body: CreateStandardResponse) {
    return this.standardResponseService.createStandardResponse(body);
  }

  @Get(":id")
  getStandardResponses(@Param("id") id: string) {
    return this.standardResponseService.getStandardResponses(id);
  }

  @Put(":id")
  updateStandardResponse(
    @Body() body: UpdateStandardResponse,
    @Param("id") id: string
  ) {
    return this.standardResponseService.updateStandardResponse(body, id);
  }

  @Delete(":id")
  deleteStandardResponse(@Param("id") id: string) {
    return this.standardResponseService.deleteStandardResponse(id);
  }
}
