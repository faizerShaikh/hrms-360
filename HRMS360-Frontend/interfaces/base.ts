import { NextComponentType, NextPageContext } from "next";

export interface BaseObjInterface {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BaseProps<T, U extends {} = {}> = NextComponentType<
  NextPageContext,
  {
    data: T;
  } & U,
  {
    data: T;
  } & U
>;

export interface CreateUpdateDialogBaseProps {
  isUpdate?: boolean;
  isStandard?: boolean;
  data?: any;
}

export interface FKBaseInterface {
  id?: string;
  name?: string;
  title?: string;
}

export interface ActionInterface {
  payload: any;
  type: string;
}
