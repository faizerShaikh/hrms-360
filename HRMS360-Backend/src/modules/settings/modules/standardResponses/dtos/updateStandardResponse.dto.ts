import { PartialType } from "@nestjs/mapped-types";
import { CreateStandardResponse } from "./createStandardResponse.dto";

export class UpdateStandardResponse extends PartialType(
  CreateStandardResponse
) {}
