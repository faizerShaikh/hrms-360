import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { MailerModule } from "@nestjs-modules/mailer";
import { Global, Module } from "@nestjs/common";
import { MailsService } from "./mails.service";
import { config } from "dotenv";
import { BullModule } from "@nestjs/bull";
import { MAILS_QUEUE } from "./constants";
import { MailsProcessor } from "./mails.processor";
import { ConfigService } from "@nestjs/config";
import { helpers } from "../../helpers";
config();

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: MAILS_QUEUE,
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          transport: {
            host: configService.get("EMAIL_HOST"),
            name: configService.get("EMAIL_NAME"),
            port: configService.get("EMAIL_PORT"), // Use the appropriate port for your Roundcube server
            secure: configService.get("EMAIL_SECURE") === "1", // Set to true if your Roundcube server requires a secure connection (e.g., using SSL/TLS)
            auth: {
              user: configService.get("EMAIL_USER"), // Your email address
              pass: configService.get("EMAIL_PASSWORD"), // Your email password
            },
            tls: {
              ciphers: "SSLv3",
              rejectUnauthorized: false,
            },
            logger: false,
            debug: false,
          },
          defaults: {
            from: configService.get("EMAIL_FROM"),
          },
          preview: false,
          template: {
            dir: "src/public/email-templates",
            adapter: new HandlebarsAdapter({ ...helpers }),
            options: {
              strict: true,
              defaultLayout: false,
            },
          },
        };
      },
    }),
  ],
  exports: [MailsService],
  providers: [MailsService, MailsProcessor],
})
export class MailsModule {}
