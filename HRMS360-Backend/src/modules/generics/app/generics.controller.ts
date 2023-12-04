import {
  BadRequestException,
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { methodOptions } from "src/common/types";
import { ControllerOptions } from "../interface";

export class GenericController {
  createDTO: any;
  updateDTO: any;
  notAllowedMethods: methodOptions[] = [];
  constructor(protected service: any, options?: ControllerOptions) {
    this.createDTO = options?.createDTO;
    this.updateDTO = options?.updateDTO;
    this.notAllowedMethods = options?.notAllowedMethods || [];
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createObj(@Body() body: any) {
    this.validateMethod(methodOptions.create);
    const obj = await this.validateData(body, this.createDTO);
    return this.service?.create(obj || body);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getAllObj() {
    this.validateMethod(methodOptions.getAll);
    return this.service?.findAll();
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  getOneObj(@Param("id") id: string) {
    this.validateMethod(methodOptions.getOne);

    return this.service?.findOne(id);
  }

  @Put(":id")
  @HttpCode(HttpStatus.ACCEPTED)
  async updateObj(@Body() body: any, @Param("id") id: string) {
    this.validateMethod(methodOptions.update);
    const obj = await this.validateData(body, this.updateDTO);
    return this.service?.update(obj || body, id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteObj(@Param("id") id: string) {
    this.validateMethod(methodOptions.delete);

    return this.service?.delete(id);
  }

  private validateMethod(name: methodOptions) {
    if (this.notAllowedMethods.includes(name)) throw new NotFoundException();
  }

  private async validateData(body: any, dto: any): Promise<any> {
    let obj;
    if (dto) {
      obj = plainToClass(dto, body) as typeof dto;

      const errors = await validate(obj, { whitelist: true });
      let message = [];
      if (errors.length) {
        errors.forEach((err) => {
          message = [...message, ...Object.values(err.constraints)];
        });
        throw new BadRequestException(message);
      }
      return obj;
    }
    return null;
  }
}
