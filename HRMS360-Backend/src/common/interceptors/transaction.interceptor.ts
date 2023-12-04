import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/sequelize";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { Sequelize } from "sequelize-typescript";

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(
    @InjectConnection()
    private readonly sequelizeInstance: Sequelize
  ) {}

  async intercept(
    _: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    return next.handle().pipe(
      tap(async () => {
        await this.sequelizeInstance.close();
      }),
      catchError(async (err) => {
        await this.sequelizeInstance.close();
        return throwError(err);
      })
    );
  }
}
