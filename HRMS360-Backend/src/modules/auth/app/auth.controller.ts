import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApsisUserDto } from "src/modules/apsis/module/apsisUser/dtos/apsisUser.dto";
import { AuthService } from "./auth.service";
import {
  ForgotPassword,
  ForgotPasswordGetOTP,
} from "src/modules/apsis/module/apsisUser/dtos/forgotPassword.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  userLogin(@Body() body: ApsisUserDto) {
    return this.authService.userLogin(body);
  }

  @Post("public-user/register")
  @HttpCode(HttpStatus.CREATED)
  apsisUserRegister(@Body() body: Partial<ApsisUserDto>) {
    return this.authService.apsisUserRegister(body);
  }

  @Post("public-user/login")
  @HttpCode(HttpStatus.OK)
  apsisUserLogin(@Body() body: ApsisUserDto) {
    return this.authService.apsisUserLogin(body);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  setPassword(@Body() body: ForgotPassword) {
    return this.authService.setPassword(body);
  }

  @Post("forgot-password/otp")
  @HttpCode(HttpStatus.OK)
  getOTP(@Body() body: ForgotPasswordGetOTP) {
    return this.authService.getOTP(body);
  }
}
