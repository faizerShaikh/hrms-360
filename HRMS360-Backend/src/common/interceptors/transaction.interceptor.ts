import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/sequelize";
import { Observable } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { Transaction } from "sequelize";
import { Sequelize } from "sequelize-typescript";

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(
    @InjectConnection()
    private readonly sequelizeInstance: Sequelize
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest();
    const transaction: Transaction = await this.sequelizeInstance.transaction({
      logging: true, // Just for debugging purposes
    });

    req.transaction = transaction;
    return next.handle().pipe(
      tap(async () => {
        await transaction.commit();
      }),
      catchError(async (err) => {
        await transaction.rollback();
        throw err;
      })
    );
  }
}
