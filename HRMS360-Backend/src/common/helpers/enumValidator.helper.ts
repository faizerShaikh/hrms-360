import { BadRequestException } from "@nestjs/common";

export function enumValidator(options: string[], field: string): {
    checkEnum:unknown
} {
  return {
    checkEnum(value: string) {
      if (!options.includes(value)) {
        throw new BadRequestException(
          `${field} must be in (${options.join(", ")})`
        );
      }
    },
  };
}
