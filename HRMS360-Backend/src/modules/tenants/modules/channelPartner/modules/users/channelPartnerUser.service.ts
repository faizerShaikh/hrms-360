import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/sequelize";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { bcrypt, getRandomPassword, getSearchObject } from "src/common/helpers";
import { RequestParamsService } from "src/common/modules";
import { MailsService } from "src/common/modules/mails";
import {
  defaultAttachments,
  defaultContext,
} from "src/common/modules/mails/constants";
import { TenantUserDto, UpdateTenatUserDto } from "src/modules/tenants/dtos";
import { TenantUser } from "src/modules/tenants/models";

export class ChannelPartnerUserService {
  constructor(
    @InjectModel(TenantUser)
    private readonly tenantUser: typeof TenantUser,
    private readonly requestParams: RequestParamsService,
    private readonly config: ConfigService,
    private readonly mailsService: MailsService
  ) {}

  async create(body: TenantUserDto) {
    if (!this.requestParams.user["is_tenant_admin"])
      throw new UnauthorizedException("Only admin can create new user");
    let password = getRandomPassword();
    body.password = await bcrypt.createHash(password);
    body.tenant_id = this.requestParams.tenant.id;

    const user = await this.tenantUser.schema(DB_PUBLIC_SCHEMA).findOne({
      where: { email: body.email },
    });

    if (user) {
      throw new BadRequestException("User with this email already exists");
    }
    const tenantUser = await this.tenantUser
      .schema(DB_PUBLIC_SCHEMA)
      .create({ ...body });
    let Mail = {
      to: tenantUser.email,
      subject: "User Login Details",
      context: {
        email: tenantUser.email,
        firstName: tenantUser.name,
        password: password,
        system_link: `${this.config.get("FE_URL")}/sign-in`,
        be_link: this.config.get("BE_URL"),
        logo: "cid:company-logo",
        ...defaultContext,
        is_tenant: true,
      },
      attachments: [
        {
          filename: "nbol-email-logo",
          path: "src/public/media/images/nbol-email-logo.png",
          cid: "company-logo",
        },
        ...defaultAttachments,
      ],
    };

    this.mailsService.TenantRegisterMail(Mail);
    return;
  }

  async getAll() {
    const data = await this.tenantUser
      .schema(DB_PUBLIC_SCHEMA)
      .findAndCountAll({
        distinct: true,
        where: {
          tenant_id: this.requestParams.tenant.id,
          ...getSearchObject(this.requestParams.query, ["name", "region"]),
        },
        group: ["id"],
        ...this.requestParams.pagination,
      });

    return { rows: data.rows, count: data.count.length };
  }

  async update(body: UpdateTenatUserDto, id: string) {
    const user = await this.tenantUser.schema(DB_PUBLIC_SCHEMA).findOne({
      where: {
        id,
      },
    });

    if (!user) throw new NotFoundException("User not found!");
    body.password = undefined;
    await user.update({ ...body });

    return "User updated successfully";
  }

  async delete(id: string) {
    if (!this.requestParams.user["is_tenant_admin"])
      throw new UnauthorizedException("Only admin can delete new user");
    const user = await this.tenantUser.schema(DB_PUBLIC_SCHEMA).findOne({
      where: {
        id,
      },
    });

    if (!user) throw new NotFoundException("User not found!");

    await user.destroy();

    return "User deleted successfully";
  }
}
