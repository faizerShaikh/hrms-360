import { Injectable, NotFoundException } from "@nestjs/common";
import {
  FindAndCountOptions,
  FindOptions,
  Includeable,
  WhereOptions,
} from "sequelize";
import { getSearchObject } from "src/common/helpers";
import { RequestParamsService } from "src/common/modules";
import { ServiceOptions } from "../interface";

@Injectable()
export class GenericsService<CreateDTO = any, UpdateDTO = any> {
  defaultOptions: Includeable | Includeable[] = [];
  isSoftDelete: boolean = false;
  defaultWhere: WhereOptions;
  options?: ServiceOptions;
  reqParam?: RequestParamsService;

  constructor(private readonly model: any, options?: ServiceOptions) {
    this.options = options;
    if (options?.include) {
      this.defaultOptions = options.include;
    }
    if (options?.isSoftDelete) {
      this.isSoftDelete = options.isSoftDelete;
    }
    if (options?.requestParams) {
      this.reqParam = options.requestParams;
    }
    if (options?.defaultWhere) {
      this.defaultWhere = options.defaultWhere;
    }
  }

  //create an object in database
  async create<T extends {} = any>(dto: CreateDTO): Promise<T> {
    const data = await this.model.create(dto);
    return data;
  }

  //update an object in database
  async update<T extends {} = any>(dto: UpdateDTO, id?: string): Promise<T> {
    const obj = await this.getOneObj<T>(id);
    await obj.update({
      ...dto,
    });

    return obj;
  }

  // findAll records for matching query
  async findAll<T extends {} = any>(
    findOptions: FindAndCountOptions = {}
  ): Promise<T[]> {
    let where = this.defaultWhere || {};

    if (this.reqParam.query) {
      where = {
        ...where,
        ...getSearchObject(this.reqParam.query, this.options.searchFields),
      };
    }

    let options: FindAndCountOptions = {
      include: this.defaultOptions,
      ...findOptions,
      ...this.reqParam.pagination,
      subQuery: false,
      distinct: true,
      where,
    };

    const data = await this.model.findAndCountAll(options);

    return data;
  }

  /// find one record for matching query
  async findOne<T extends {} = any>(id?: string): Promise<T> {
    const data = await this.getOneObj<T>(id, true);

    return data;
  }

  //delete records for matching query
  async delete(id?: string): Promise<boolean> {
    const obj = await this.getOneObj(id);
    if (this.isSoftDelete) {
      await obj.update({ is_deleted: true });
    } else {
      await obj.destroy();
    }

    return true;
  }

  //delete records for matching query
  async softDelete(id?: string): Promise<boolean> {
    const obj = await this.getOneObj(id);

    await obj.update({ is_deleted: true });

    return true;
  }

  async getOneObj<M = any>(
    options?: string | FindOptions,
    isJoin: boolean = false
  ): Promise<M | any> {
    let findOptions: any = {};
    if (typeof options === "string") {
      findOptions = { where: { ...this.defaultWhere, id: options } };
    } else {
      findOptions = {
        where: { ...this.defaultWhere, ...options.where },
        ...options,
      };
    }
    if (this.isSoftDelete) {
      findOptions.where.is_deleted = false;
    }

    const obj = await this.model.findOne({
      ...findOptions,
      include: isJoin ? this.defaultOptions : [],
    });
    if (!obj) {
      throw new NotFoundException(`${this.model.name} not found!`);
    }
    return obj;
  }
}
