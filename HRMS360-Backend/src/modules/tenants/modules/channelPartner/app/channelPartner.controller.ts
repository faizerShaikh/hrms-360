import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";

import { CreateTenant } from "src/modules/tenants/dtos";
import { UpdateTenant } from "src/modules/tenants/dtos/updateTenant.dto";
import { ChannelPartnerService } from "./channelPartner.service";

@Controller("channel-partner")
export class ChannelPartnerController {
  constructor(private readonly channelPartnerService: ChannelPartnerService) {}

  @Get("tenant")
  getAllTenants() {
    return this.channelPartnerService.getAllTenants();
  }

  @Get("tenant/:id")
  getSingleTenant(@Param("id") id: string) {
    return this.channelPartnerService.getSingleTenant(id);
  }

  @Put("tenant/:id")
  updateTenant(@Param("id") id: string, @Body() body: UpdateTenant) {
    return this.channelPartnerService.updateTenant(id, body);
  }

  @Delete("tenant/:id")
  deleteTenant(@Param("id") id: string) {
    return this.channelPartnerService.deleteTenant(id);
  }

  @Post("tenant")
  createTenant(@Body() body: CreateTenant) {
    return this.channelPartnerService.createTenant(body);
  }
}
