import { methodOptions } from "src/common/types";

export interface ControllerOptions {
  notAllowedMethods?: methodOptions[];
  createDTO?: any;
  updateDTO?: any;
}
