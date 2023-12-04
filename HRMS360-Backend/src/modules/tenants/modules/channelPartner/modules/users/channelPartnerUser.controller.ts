import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from "@nestjs/common";

import { TenantUserDto, UpdateTenatUserDto } from "src/modules/tenants/dtos";
import { ChannelPartnerUserService } from "./channelPartnerUser.service";

@Controller("channel-partner/user")
export class ChannelPartnerUserController {
  constructor(
    private readonly channelPartnerUserService: ChannelPartnerUserService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: TenantUserDto) {
    return this.channelPartnerUserService.create(body);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getAll() {
    return this.channelPartnerUserService.getAll();
  }

  @Put(":id")
  @HttpCode(HttpStatus.ACCEPTED)
  update(@Body() body: UpdateTenatUserDto, @Param("id") id: string) {
    return this.channelPartnerUserService.update(body, id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param("id") id: string) {
    return this.channelPartnerUserService.delete(id);
  }
}
