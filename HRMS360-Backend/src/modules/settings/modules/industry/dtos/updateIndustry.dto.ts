import { PartialType } from "@nestjs/mapped-types";
import { CreateIndustryDTO } from "./createIndustry.dto";

export class UpdateIndustryDTO extends PartialType(CreateIndustryDTO) {}
