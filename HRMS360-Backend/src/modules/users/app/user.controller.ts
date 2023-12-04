import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { join } from "path";
import { Op } from "sequelize";
import { GetUser } from "src/common/decorators";
import { MulterIntercepter } from "src/common/interceptors";
import { MulterEnum } from "src/common/interfaces/multer.interfaces";
import { RequestParamsService } from "src/common/modules";
import { GenericController } from "src/modules/generics/app/generics.controller";
import { TenantUser } from "src/modules/tenants/models";
import { CreateUserDto, UpdateDTO } from "../dtos";
import { UserService } from "./user.service";

@Controller("user")
export class UserController extends GenericController {
  constructor(
    private readonly userService: UserService,
    private readonly requestParams: RequestParamsService
  ) {
    super(userService, {
      createDTO: CreateUserDto,
      updateDTO: UpdateDTO,
    });
  }

  @Get()
  getAllObj(
    @GetUser() user?: TenantUser,
    @Query("query") text?: string,
    @Query("me") me?: string
  ) {
    let query = {};
    if (me === "false") {
      query["id"] = { [Op.ne]: user.id };
    }

    if (text) {
      let condition = {
        [Op.iLike]: "%" + text + "%",
      };

      query = {
        [Op.or]: {
          name: condition,
        },
      };
    }
    return this.userService.findAll({ where: query });
  }

  @Get("me")
  getMe(@GetUser() user: TenantUser) {
    if (this.requestParams.tenant.is_channel_partner) {
      return user;
    }
    return this.userService.getMe(user.id);
  }

  @Get("group-by/:param")
  getGroupBy(@Param("param") param: string, @Query("query") query: string) {
    return this.userService.getGroupBy(param, query);
  }

  @Get("excel-file")
  getSampleExcel() {
    return this.userService.getExcel();
  }

  @Post("excel-file")
  @UseInterceptors(
    MulterIntercepter({
      type: MulterEnum.single,
      fieldName: "file",
      path: "/media/import-excels",
      addDateTime: false,
    })
  )
  createUsersViaExcel(
    @UploadedFile()
    file: Express.Multer.File
  ) {
    return this.userService.createExcelUsers(file);
  }

  @Post("import")
  addLineManager(@Body() data: CreateUserDto[]) {
    return this.userService.addLineManagerForUser(data);
  }
}
