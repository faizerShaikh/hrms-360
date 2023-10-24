import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/sequelize";
import { literal } from "sequelize";
import { DB_PUBLIC_SCHEMA } from "src/common/constants";
import { bcrypt } from "src/common/helpers";
import { Tenant, TenantUser } from "src/modules/tenants/models";
import { ApsisUserDto } from "src/modules/apsis/module/apsisUser/dtos/apsisUser.dto";
import { ApsisUser } from "src/modules/apsis/module/apsisUser/model";
import { User } from "src/modules/users/models";
import {
  ForgotPassword,
  ForgotPasswordGetOTP,
} from "src/modules/apsis/module/apsisUser/dtos/forgotPassword.dto";
import { MailsService } from "src/common/modules/mails";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(ApsisUser)
    private readonly apsisUser: typeof ApsisUser,
    @InjectModel(TenantUser)
    private readonly tenantUser: typeof TenantUser,
    @InjectModel(User)
    private readonly user: typeof User,
    private readonly mailsService: MailsService,
    private readonly jwtService: JwtService
  ) {}

  async apsisUserRegister(body: Partial<ApsisUserDto>) {
    body.password = await bcrypt.createHash("1234");

    const user = await this.apsisUser.schema(DB_PUBLIC_SCHEMA).create({
      email: body.email,
      password: body.password,
    });
    user.password = undefined;
    return user;
  }

  async apsisUserLogin(body: ApsisUserDto) {
    const user = await this.apsisUser
      .schema(DB_PUBLIC_SCHEMA)
      .findOne<ApsisUser>({
        where: {
          email: body.email,
        },
      });

    if (!user) throw new UnauthorizedException("Invalid credintials!");

    const isMatched = await bcrypt.compare(user.password, body.password);

    if (!isMatched) throw new UnauthorizedException("Invalid credintials!");

    let token = await this.jwtService.signAsync({
      id: user.id,
      is_apsis_user: true,
    });
    user.password = undefined;
    return { token, user };
  }

  async userLogin(body: ApsisUserDto) {
    const user = await this.tenantUser
      .schema(DB_PUBLIC_SCHEMA)
      .findOne<TenantUser>({
        where: {
          email: body.email,
        },
        include: [
          {
            model: Tenant,
            on: literal('"TenantUser"."tenant_id" = "my_tenant"."id"'),
          },
        ],
      });

    if (!user || !user.password)
      throw new UnauthorizedException("Invalid credintials!");

    if (!user.my_tenant.is_active)
      throw new UnauthorizedException("Tenant is Inactive!");

    const isMatched = await bcrypt.compare(user.password, body.password);

    if (!isMatched) throw new UnauthorizedException("Invalid credintials!");

    let token = await this.jwtService.signAsync({
      id: user.id,
    });

    user.password = undefined;
    return {
      token,
      user,
      tenant: user.my_tenant,
    };
  }

  async getOTP(body: ForgotPasswordGetOTP) {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const user = await this.tenantUser
      .schema(DB_PUBLIC_SCHEMA)
      .findOne<TenantUser>({
        where: {
          email: body.email,
        },
        include: [
          {
            model: Tenant.schema(DB_PUBLIC_SCHEMA),
            on: literal('"TenantUser"."tenant_id" = "my_tenant"."id"'),
          },
        ],
      });
    if (!user)
      throw new UnauthorizedException("Invalid email, please check email!");

    if (!user.my_tenant.is_active)
      throw new UnauthorizedException(
        "Tenant is not active, please activate or get in touch with admin!"
      );

    if (!user.password)
      throw new UnauthorizedException("Invalid email, please check email!");

    let Mail = {
      to: user.email,
      template: "ForgotPassword",
      subject: `Reset Your Password for Insight 360 - Feedback for Leaders Application`,
      context: {
        otp,
        logo: "cid:company-logo",
      },
      attachments: [
        {
          filename: "company-logo",
          path: "src/public/media/images/nbol-email-logo.png",
          cid: "company-logo",
        },
      ],
    };
    await this.mailsService.SendOTP(Mail);
    return {
      otp,
    };
  }

  async setPassword(body: ForgotPassword) {
    const user = await this.tenantUser
      .schema(DB_PUBLIC_SCHEMA)
      .findOne<TenantUser>({
        where: {
          email: body.email,
        },
        include: [
          {
            model: Tenant.schema(DB_PUBLIC_SCHEMA),
            on: literal('"TenantUser"."tenant_id" = "my_tenant"."id"'),
          },
        ],
      });

    if (!user.my_tenant.is_active)
      throw new UnauthorizedException(
        "Tenant is not active, please activate or get in touch with admin!"
      );

    if (!user)
      throw new UnauthorizedException("Invalid email, please check email!");

    if (!user.password)
      throw new UnauthorizedException("Invalid email, please check email!");

    const password = await bcrypt.createHash(body.password);

    await user.update({
      password,
    });

    if (!user.my_tenant.is_channel_partner) {
      await this.user.schema(user.my_tenant.schema_name).update(
        {
          password,
        },
        {
          where: {
            email: body.email,
          },
        }
      );
    }

    return "Password updated successfully";
  }
}
