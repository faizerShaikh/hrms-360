import { IsNotEmpty, IsString } from "class-validator";

export class DesignationDTO {
  @IsString()
  @IsNotEmpty()
  name: string;
}
