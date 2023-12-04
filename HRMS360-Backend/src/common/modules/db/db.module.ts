import { Global, Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";

@Global()
@Module({
  imports: [],
  controllers: [],
  exports: [SequelizeModule],
  providers: [],
})
export class DBModule {}
