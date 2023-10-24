export enum MulterEnum {
  single,
  multiple,
}

export interface MulterOptions {
  type: MulterEnum;
  fieldName: string;
  maxFiles?: number;
  addDateTime?: boolean;
  path: string;
}
