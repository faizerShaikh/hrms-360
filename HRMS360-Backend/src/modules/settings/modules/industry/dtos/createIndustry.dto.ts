import { IsNotEmpty, IsString } from "class-validator";

export class CreateIndustryDTO {
  @IsString()
  @IsNotEmpty()
  name: string;
}
