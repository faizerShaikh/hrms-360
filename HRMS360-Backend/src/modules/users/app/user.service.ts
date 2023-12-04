import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { unlink } from "fs";
import { join } from "path";
import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { DB_PUBLIC_SCHEMA, userExcelColumnsMap } from "src/common/constants";
import { RequestParamsService } from "src/common/modules";
import { GenericsService } from "src/modules/generics/app/generics.service";
import { Department } from "src/modules/settings/modules/department/models";
import { Designation } from "src/modules/settings/modules/designation/models";
import { Tenant, TenantMetaData, TenantUser } from "src/modules/tenants/models";
import { CreateUserDto } from "../dtos";
import { User } from "../models";
import { validateEmail } from "src/common/helpers";
const ExcelJS = require("exceljs");

@Injectable()
export class UserService extends GenericsService {
  constructor(
    @InjectModel(User) private readonly user: typeof User,
    @InjectModel(Department) private readonly department: typeof Department,
    @InjectModel(Designation) private readonly designation: typeof Designation,
    @InjectModel(TenantUser) private readonly tenantUser: typeof TenantUser,
    private readonly requestParams: RequestParamsService,
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(TenantMetaData)
    private readonly tenantMetaData: typeof TenantMetaData
  ) {
    super(User.schema(requestParams.schema_name), {
      include: [
        {
          model: Department,
          attributes: ["name", "id"],
        },
        {
          model: Designation,
          attributes: ["name", "id"],
        },
        {
          model: User,
          as: "line_manager",

          attributes: ["name", "id", "email"],
        },
        {
          model: User,
          as: "secondary_line_manager",
          attributes: ["name", "id"],
        },
      ],
      requestParams,
      searchFields: [
        '"User"."name"',
        '"User"."email"',
        '"User"."region"',
        '"User"."contact"',
        '"department"."name"',
        '"designation"."name"',
        '"line_manager"."name"',
        '"secondary_line_manager"."name"',
      ],
    });
  }

  async create(dto: CreateUserDto): Promise<any> {
    if (
      this.requestParams.tenant.no_of_employee_created + 1 ===
      this.requestParams.tenant.no_of_employee
    ) {
      throw new BadRequestException(
        `Number of employees limit exceeded, limit for your tenant is (${this.requestParams.tenant.no_of_employee}). Please contact admin for further clarification`
      );
    }

    const isTenantuser = await this.tenantUser
      .schema(DB_PUBLIC_SCHEMA)
      .findOne({
        where: { email: dto.email },
        include: [{ model: Tenant }],
      });

    if (isTenantuser) {
      if (isTenantuser.my_tenant.is_channel_partner) {
        throw new BadRequestException("User with this email already exists!");
      }
      const isUserInTenant = await User.schema(
        isTenantuser.my_tenant.schema_name
      ).findOne({
        where: { email: dto.email },
      });
      if (isUserInTenant)
        throw new BadRequestException("User with this email already exists!");
    }

    const user = await this.user.schema(this.reqParam.schema_name).create({
      ...dto,
      tenant_id: this.requestParams.tenant.id,
    });

    await this.requestParams.tenant.increment("no_of_employee_created");

    await this.tenantMetaData
      .schema(DB_PUBLIC_SCHEMA)
      .increment("total_users_onboarded", {
        where: {
          tenant_id: [
            this.requestParams.tenant.id,
            this.requestParams.tenant.parent_tenant_id,
          ],
        },
      });

    return user;
  }

  async getGroupBy(param: string, text?: string) {
    if (!["department", "designation"].includes(param))
      throw new BadRequestException(
        "Please provide param name in department or designation"
      );

    let query: any = {};
    if (text) {
      let condition = {
        ...query,
        [Op.iLike]: "%" + text + "%",
      };

      query = {
        ...query,
        [Op.or]: {
          '$"users"."name"$': condition,
          "name": condition,
        },
      };
    }

    return this[param].schema(this.reqParam.schema_name).findAll({
      where: {
        ...query,
      },
      attributes: ["id", "name"],
      include: {
        model: User,
        required: true,
        attributes: [
          "name",
          "id",
          "department_id",
          "designation_id",
          "email",
          "contact",
          "region",
        ],
        include: [
          {
            model: Department,
            attributes: ["name", "id"],
          },
          {
            model: Designation,
            attributes: ["name", "id"],
          },
          {
            model: User,
            as: "line_manager",
            attributes: ["name", "id", "email"],
          },
        ],
      },
    });
  }

  async update<T extends {} = any>(dto: any, id?: string): Promise<T> {
    const isTenantuser = await this.tenantUser
      .schema(DB_PUBLIC_SCHEMA)
      .findOne({
        where: { email: dto.email },
        include: [{ model: Tenant }],
      });

    if (isTenantuser) {
      if (isTenantuser.my_tenant.is_channel_partner) {
        throw new BadRequestException("User with this email already exists!");
      }
      const isUserInTenant = await User.schema(
        isTenantuser.my_tenant.schema_name
      ).findOne({
        where: { email: dto.email },
      });
      if (isUserInTenant && isUserInTenant.id !== id)
        throw new BadRequestException("User with this email already exists!");
    }

    return await super.update(dto, id);
  }

  async getMe(id: string) {
    const user = await this.getOneObj(
      {
        where: { id },
      },
      true
    );
    return user;
  }

  async getExcel() {
    const depart = await this.department
      .schema(this.reqParam.schema_name)
      .findAll<Department>({
        attributes: ["name"],
      });
    const desig = await this.designation
      .schema(this.reqParam.schema_name)
      .findAll<Designation>({
        attributes: ["name"],
      });

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("Sample Employee Excel", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    const depsSheet = workbook.addWorksheet("Departments");
    const desigSheet = workbook.addWorksheet("Designation");

    desigSheet.state = "veryHidden";
    depsSheet.state = "veryHidden";

    depsSheet.columns = [
      {
        header: "Department Name",
        key: "name",
        width: 0,
        hidden: true,
        readOnly: true,
      },
    ];

    depsSheet.addRows(depart);

    desigSheet.columns = [
      {
        header: "Designation Name",
        key: "name",
        width: 0,
        hidden: true,
        readOnly: true,
      },
    ];
    desigSheet.addRows(desig);

    sheet.columns = [
      { header: "Employee Name", key: "name", width: 30 },
      { header: "Employee Email ID", key: "email", width: 30 },
      { header: "Designation", key: "designation_id", width: 30 },
      { header: "Department", key: "department_id", width: 30 },
      { header: "Contact No", key: "contact", width: 30 },
      { header: "Region", key: "region", width: 30 },
    ];

    // Designation Column
    sheet.dataValidations.add("C2:C9999", {
      type: "list",
      allowBlank: false,
      formulae: [`=Designation!$A$2:$A${desig.length + 1}`],
      showErrorMessage: true,
      errorStyle: "error",
      error: "Enter the correct designation",
    });

    // Department Column
    sheet.dataValidations.add("D2:D9999", {
      type: "list",
      allowBlank: false,
      formulae: [`=Departments!$A$2:$A${depart.length + 1}`],
      showErrorMessage: true,
      errorStyle: "error",
      error: "Enter the correct department",
    });

    await workbook.xlsx.writeFile(
      "./src/public/media/excels/Sample-Employee-Excel.xlsx"
    );
    return "/media/excels/Sample-Employee-Excel.xlsx";
  }

  async createExcelUsers(file: any) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(`${file.path}`);
    const sheet = workbook.getWorksheet("Sample Employee Excel");

    if (!sheet)
      throw new NotFoundException(
        "Sheet not Found. Please use downloaded sample excel file"
      );
    const { no_of_employee, no_of_employee_created } =
      this.requestParams.tenant;

    const remainingSlots = no_of_employee - no_of_employee_created;
    const rs = sheet.getColumn(1);

    let rowsCount = 0;

    rs.eachCell(() => {
      rowsCount++;
    });

    if (rowsCount < 2) {
      throw new BadRequestException(`Excel is empty`);
    }

    if (rowsCount > remainingSlots) {
      throw new BadRequestException(
        `Number of Employee limit exceeded, Only ${remainingSlots} more users can be added`
      );
    }

    const depart = await this.department
      .schema(this.reqParam.schema_name)
      .findAll<Department>({
        attributes: ["id", "name"],
      });
    const desig = await this.designation
      .schema(this.reqParam.schema_name)
      .findAll<Designation>({
        attributes: ["id", "name"],
      });

    let maxLength = Math.max(depart.length, desig.length);

    let depValues = {};
    let desValues = {};

    for (let i = 0; i < maxLength; i++) {
      if (depart[i]) {
        depValues[depart[i].name] = depart[i].id;
      }
      if (desig[i]) {
        desValues[desig[i].name] = desig[i].id;
      }
    }

    let rows = sheet.getRows(2, rowsCount).values();

    let data: any = [];
    for (let row of rows) {
      let obj: any = {};
      row.eachCell((cell: any, cn: any) => {
        if (typeof cell.value === "object" && "text" in cell.value) {
          obj[userExcelColumnsMap[cn]] = cell.value.text;
        } else {
          if (userExcelColumnsMap[cn] === "department_id") {
            obj[userExcelColumnsMap[cn]] = depValues[cell.value];
            obj[userExcelColumnsMap[8]] = cell.value;
          } else if (userExcelColumnsMap[cn] === "designation_id") {
            obj[userExcelColumnsMap[cn]] = desValues[cell.value];
            obj[userExcelColumnsMap[7]] = cell.value;
          } else {
            obj[userExcelColumnsMap[cn]] = cell.value;
          }
        }
      });

      if (Object.keys(obj).length) {
        if (!validateEmail(obj.email)) {
          throw new BadRequestException(
            `Please add a valid email. (${obj.email})`
          );
        }

        const isTenantuser = await this.tenantUser
          .schema(DB_PUBLIC_SCHEMA)
          .findOne({
            where: { email: obj.email },
            include: [{ model: Tenant }],
          });

        if (isTenantuser) {
          if (isTenantuser.my_tenant.is_channel_partner) {
            throw new BadRequestException(
              "User with this email already exists!"
            );
          }
          const isUserInTenant = await User.schema(
            isTenantuser.my_tenant.schema_name
          ).findOne({
            where: { email: obj.email },
          });
          if (isUserInTenant)
            throw new BadRequestException(
              "User with this email already exists!"
            );
        }
        let build: any = this.user.schema(this.reqParam.schema_name).build(obj);
        data.push({
          ...build.dataValues,
          department_name: obj.department_name,
          designation_name: obj.designation_name,
        });
      }
    }

    let emailsArr = [];
    data.forEach((obj) => {
      if (emailsArr.some((e) => e === obj.email)) {
        throw new BadRequestException(
          `Duplicate email identified (${obj.email}), please check excel again`
        );
      }
      emailsArr.push(obj.email);
    });

    unlink(join(__dirname, "../../../../", file.path), () => {
      console.log("File Deleted");
    });

    return data;
  }

  async addLineManagerForUser(data: CreateUserDto[]) {
    let userArr = [];
    let userLineManager = {};

    for (const item of data) {
      const { id, email, line_manager_id, name } = item;

      if (id === line_manager_id.id) {
        throw new BadRequestException(
          `Same user cannot be the line manager (${name})`
        );
      }

      const ifUserInOtherTenants = await this.tenantUser
        .schema(DB_PUBLIC_SCHEMA)
        .findOne({
          where: { email },
        });
      const ifUser = await this.user.schema(this.reqParam.schema_name).findOne({
        where: { email },
      });

      if (ifUser && ifUserInOtherTenants)
        throw new BadRequestException("User with this email already exists");

      userArr.push({
        ...item,
        line_manager_id: line_manager_id.id,
        secondary_line_manager_id: line_manager_id.line_manager_id,
        tenant_id: this.requestParams.tenant.id,
      });

      userLineManager[email] = line_manager_id.email;
    }

    // check circular dependancy
    for (const user in userLineManager) {
      // get line manager for current user
      let currentUserLineManager = userLineManager[user];

      // get line manager of line manager
      let lineManagerOfLineManger = userLineManager[currentUserLineManager];

      if (lineManagerOfLineManger === user) {
        throw new BadRequestException(
          `Circular Dependancy detected for following users (user=${user} and line manager=${currentUserLineManager}), please rectify the same in the excel file`
        );
      }
    }

    const { no_of_employee, no_of_employee_created } =
      this.requestParams.tenant;

    const remainingSlots = no_of_employee - no_of_employee_created;

    if (userArr.length > remainingSlots) {
      throw new BadRequestException(
        `Number of Employee limit exceeded, Only ${remainingSlots} more users can be added`
      );
    }

    const user = await this.user
      .schema(this.reqParam.schema_name)
      .bulkCreate(userArr);

    await this.requestParams.tenant.update({
      no_of_employee_created:
        this.requestParams.tenant.no_of_employee_created + userArr.length,
    });
    return user;
  }

  async delete(id?: string): Promise<boolean> {
    const user = await this.user.schema(this.reqParam.schema_name).findOne({
      where: { id },
    });

    if (!user) throw new NotFoundException("User not found");
    await this.sequelize.query(
      `DELETE FROM only ${DB_PUBLIC_SCHEMA}.tenant_users WHERE email = '${user.email}';`
    );
    await this.requestParams.tenant.update({
      no_of_employee_created:
        this.requestParams.tenant.no_of_employee_created - 1,
    });

    await user.destroy();
    return;
  }
}
