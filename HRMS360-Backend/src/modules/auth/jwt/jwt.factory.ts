import { ConfigService } from '@nestjs/config';

export const jwtFactory = {
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get('JWTKEY'),
  }),
  inject: [ConfigService],
};
