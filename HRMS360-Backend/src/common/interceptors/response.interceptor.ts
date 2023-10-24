import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Response<T> {
  status: number;
  data?: T;
  message?: string;
  success: boolean;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor() {}
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<Response<T>> {
    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        let response: Response<T> = { success: true, status: res.statusCode };
        if (typeof data === "string") {
          response.message = data;
        } else if (typeof data === "object") {
          response.data = data;
        }
        return response;
      })
    );
  }
}
