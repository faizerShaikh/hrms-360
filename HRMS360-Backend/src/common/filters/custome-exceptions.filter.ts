import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from "sequelize";

@Catch()
export class CustomeExceptionsFilter implements ExceptionFilter {
  private readonly logger: Logger;
  constructor() {
    this.logger = new Logger();
  }

  catch(
    exception:
      | ValidationError
      | UniqueConstraintError
      | ForeignKeyConstraintError
      | any,
    host: ArgumentsHost
  ): void {
    let message: string | string[] =
      exception?.message || "Something went wrong!";

    const ctx = host.switchToHttp();

    const request = ctx.getRequest();
    const response = ctx.getResponse();

    let statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception.response) {
      message = exception.response.message;
    }

    if (!request.url.startsWith("/media/tenant/")) {
      console.log(exception);
    }

    if (exception.errors) {
      message = exception.errors.map((err: any) => err.message);
    }

    if (exception?.name === "SequelizeValidationError") {
      statusCode = HttpStatus.BAD_REQUEST;
      message = exception.errors.map((err: any) => err.message);
    } else if (exception?.name === "SequelizeForeignKeyConstraintError") {
      statusCode = HttpStatus.BAD_REQUEST;
      message = `Invalid ID for foregion ${exception.parent.detail
        .split("=")[0]
        .replace(/\(|\)/g, "")} in ${exception.parent.table} table`;
    } else if (
      exception &&
      exception?.name === "SequelizeUniqueConstraintError"
    ) {
      statusCode = HttpStatus.BAD_REQUEST;

      if (
        exception.parent.detail.match(/\(question_id, area_assessment_id\)/g) &&
        exception.parent.detail.match(/\(question_id, area_assessment_id\)/g)
          .length
      ) {
        message = "There might be duplicate area assessment in same question";
      } else {
        message = exception.errors.map((err: any) => err.message);
      }
    }

    const logBody: any = {
      statusCode,
      path: request.url,
      method: request.method,
      errorName: exception?.name,
      message: message,
    };

    const responseBody = {
      status: statusCode,
      success: false,
      message,
    };
    if (!request.url.startsWith("/media/tenant/")) {
      this.logger.error(
        `Request Method : ${request.method} | Request Path : ${
          request.url
        } | Error : ${JSON.stringify(logBody)}`
      );
    }

    return response.status(statusCode).json(responseBody);
  }
}
