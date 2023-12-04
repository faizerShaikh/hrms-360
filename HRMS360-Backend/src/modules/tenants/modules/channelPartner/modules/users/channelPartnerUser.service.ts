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
import { TenantUserDto, UpdateTenatUserDto } from "src/modules/tenants/dtos";
import { TenantUser } from "src/modules/tenants/models";

export class ChannelPartnerUserService {
  constructor(
    @InjectModel(TenantUser)
    private readonly tenantUser: typeof TenantUser,
    private readonly requestPatams: RequestParamsService,
    private readonly config: ConfigService,
    private readonly mailsService: MailsService
  ) {}

  async create(body: TenantUserDto) {
    if (!this.requestPatams.getUser()["is_tenant_admin"])
      throw new UnauthorizedException("Only admin can create new user");
    let password = getRandomPassword();
    body.password = await bcrypt.createHash(password);
    body.tenant_id = this.requestPatams.tenant.id;

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
        password: password,
        system_link: `${this.config.get("FE_URL")}/sign-in`,
        be_link: this.config.get("BE_URL"),
        logo: "cid:company-logo",
        is_tenant: true,
      },
      attachments: [
        {
          filename: "company-logo",
          path: "src/public/media/images/company-logo.png",
          cid: "company-logo",
        },
      ],
    };

    this.mailsService.TenantRegisterMail(Mail);
    return;
  }

  async getAll() {
    return this.tenantUser.schema(DB_PUBLIC_SCHEMA).findAndCountAll({
      where: {
        tenant_id: this.requestPatams.tenant.id,
        ...getSearchObject(this.requestPatams.query, [
          "name",
          "region",
          "email",
        ]),
      },
      group: ["email", "id"],
      ...this.requestPatams.pagination,
    });
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
    if (!this.requestPatams.getUser()["is_tenant_admin"])
      throw new UnauthorizedException("Only admin can delete user");
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
