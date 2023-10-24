import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as morgan from "morgan";
import { ValidationPipe } from "@nestjs/common";
import { config } from "dotenv";
import { CustomeExceptionsFilter } from "./common/filters";
import { json } from "express";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { handlebars } from "./common/helpers";
config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // templet engine
  app.setBaseViewsDir(join(__dirname, "../src/public", "report"));
  const hbs = handlebars();
  app.engine(".hbs", hbs.engine);
  app.setViewEngine(".hbs");

  // cors
  app.enableCors();

  // request logger
  app.use(morgan("dev"));

  // set prefix
  app.setGlobalPrefix("api/v1");

  // body limit
  app.use(json({ limit: "50mb" }));

  // set Globle filters
  app.useGlobalFilters(new CustomeExceptionsFilter());

  // set Globle Pipes
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT);
}
bootstrap();
