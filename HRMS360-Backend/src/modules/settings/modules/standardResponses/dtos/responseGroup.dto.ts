import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateResponseGroupDTO {
  @IsString()
  @IsNotEmpty()
  title: string;
}
export class UpdateResponseGrpoupDTO extends PartialType(
  CreateResponseGroupDTO
) {}
