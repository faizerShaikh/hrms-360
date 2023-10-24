export interface ResponseInterface {
  data: ResponseData;
  status: number;
  statusText: string;
}

export interface ResponseData {
  success: boolean;
  status: number;
  data?: any;
  message?: string | string[];
}
