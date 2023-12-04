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
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { Public } from "src/common/decorators";
import { MulterIntercepter } from "src/common/interceptors";
import { MulterEnum } from "src/common/interfaces/multer.interfaces";
import { CreateTenant } from "../dtos";
import { UpdateTenant } from "../dtos/updateTenant.dto";
import { TenantsService } from "./tenants.service";

@Controller("tenant")
export class TenantsController {
  constructor(private readonly tenantService: TenantsService) {}

  @Get("path")
  async getChormeExecutable() {
    const exec = require("child_process").exec;
    return new Promise((resolve) => {
      exec("whereis google-chrome-stable", (error, stdout, stderr) => {
        if (error) {
          console.warn(error);
        }
        resolve(stdout ? stdout : stderr);
      });
    });
  }

  @Get()
  getAllTenants() {
    return this.tenantService.getAllTenants();
  }

  @Get("channel-partner")
  getAllChannelPartners() {
    return this.tenantService.getAllChannelPartners();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTenant(@Body() body: CreateTenant) {
    return this.tenantService.createTenant(body);
  }

  @Public()
  @Post("/migrate-public")
  @HttpCode(HttpStatus.CREATED)
  setInitialSetup() {
    return this.tenantService.setInitialSetup();
  }

  @Public()
  @Put("/migrate")
  @HttpCode(HttpStatus.ACCEPTED)
  runMigrations(@Body() body: string[]) {
    return this.tenantService.runMigrations(body);
  }

  @Post("channel-partner")
  @HttpCode(HttpStatus.CREATED)
  createChannelPartner(@Body() body: CreateTenant) {
    return this.tenantService.createChannelPartner(body);
  }

  @Public()
  @Get("migrate-data/:schema_name")
  @HttpCode(HttpStatus.CREATED)
  migrateData(@Param("schema_name") schema_name: string) {
    return this.tenantService.migrateData(schema_name);
  }

  @Put("/tenant-pic/:id")
  @UseInterceptors(
    MulterIntercepter({
      type: MulterEnum.single,
      fieldName: "tenant_pic",
      path: "/media/tenant",
    })
  )
  uploadTenantLogo(
    @UploadedFile() file: Express.Multer.File,
    @Param("id") id: string
  ) {
    return this.tenantService.uploadTenantLogo(file, id);
  }

  @Put(":id")
  @HttpCode(HttpStatus.ACCEPTED)
  updateTenant(@Param("id") id: string, @Body() body: UpdateTenant) {
    return this.tenantService.updateTenant(id, body);
  }

  @Get(":id")
  getSingleTenantDetails(@Param("id") id: string) {
    return this.tenantService.getSingleTenantDetails(id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTenant(@Param("id") id: string) {
    return this.tenantService.deleteTenant(id);
  }
}
