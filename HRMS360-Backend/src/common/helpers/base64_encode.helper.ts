import { readFileSync } from "fs";

export function base64_encode(file: string) {
  return "data:image/gif;base64," + readFileSync(file, "base64");
}
