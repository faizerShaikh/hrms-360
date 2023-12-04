import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWTKEY"),
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [JwtModule],
})
export class GlobalJwtModule {}
