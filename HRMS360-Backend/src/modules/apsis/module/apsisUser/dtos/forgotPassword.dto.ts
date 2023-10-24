import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ForgotPasswordGetOTP {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class ForgotPassword {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
