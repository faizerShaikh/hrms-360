import { Global, Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DBProvider } from "./db.provider";

import { DBService } from "./db.service";

@Global()
@Module({
  imports: [...DBProvider],
  controllers: [],
  exports: [DBService, SequelizeModule],
  providers: [DBService],
})
export class DBModule {}
