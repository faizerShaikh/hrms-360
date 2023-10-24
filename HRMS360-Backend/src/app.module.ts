import { QuestionModule } from "./modules/competencies/modules/questions/app/question.module";
import { UsersModule } from "./modules/users/app/users.module";
import { TenantsModule } from "./modules/tenants/app/tenants.module";
import { SurveyModule } from "./modules/surveys/app/survey.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { QuestionnaireModule } from "./modules/questionnaires/app/questionnaire.module";
import { DashboardModule } from "./modules/dashboards/app/dashboard.module";
import { CompetencyModule } from "./modules/competencies/app/competency.module";
import { AuthModule } from "./modules/auth/app/auth.module";
import { MiddlewareConsumer, Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ResponseInterceptor } from "./common/interceptors";
import {
  DBService,
  RequestParamsModule,
  publicTables,
  schemaTables,
} from "./common/modules";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TenantMiddleware } from "./common/middlewares/tenant.middleware";
import { SequelizeModule } from "@nestjs/sequelize";
import { Tenant, TenantUser } from "./modules/tenants/models";
import { AuthMiddleware } from "./common/middlewares";
import { ApsisUser } from "./modules/apsis/module/apsisUser/model";
import { User } from "./modules/users/models";
import { jwtFactory } from "./modules/auth/jwt";
import { JwtModule } from "@nestjs/jwt";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { SettingsModule } from "./modules/settings/app/settings.module";
import { ChannelPartnerModule } from "./modules/tenants/modules/channelPartner/app/channelPartner.module";
import { MailsModule } from "./common/modules/mails";
import { CronjobModule } from "./common/modules/cronjob/cronjob.module";
import { EmployeeDirectoryModule } from "./modules/employee-directory/employeeDirectory.module";
import { BullModule } from "@nestjs/bull";
import { ApsisReportsModule } from "./modules/apsis/module/reports/reports.module";
import { databaseConfig } from "./config";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get("REDIS_HOST"),
          port: +configService.get("REDIS_PORT"),
        },
      }),
      inject: [ConfigService],
    }),
    SequelizeModule.forRoot({
      ...databaseConfig[process.env.NODE_ENV || "development"],
      models: [...publicTables, ...schemaTables],
      sync: false,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "src/public"),
    }),
    SequelizeModule.forFeature([Tenant, ApsisUser, User, TenantUser]),
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({ ...jwtFactory }),
    EmployeeDirectoryModule,
    ChannelPartnerModule,
    RequestParamsModule,
    QuestionnaireModule,
    ApsisReportsModule,
    CompetencyModule,
    DashboardModule,
    SettingsModule,
    QuestionModule,
    TenantsModule,
    ReportsModule,
    CronjobModule,
    SurveyModule,
    MailsModule,
    UsersModule,
    AuthModule,
  ],
  exports: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        "/media(.*)",
        "/report(.*)",
        "/reports/(.*)",
        "/api/v1/tenant(.*)",
        "/api/v1/auth(.*)",
        "(.*)standerd",
        "/api/v1/survey/decode-token/(.*)",
        "/api/v1/survey/detail",
        "/api/v1/survey/detail-old",
        "/api/v1/nbol-survey/submit-survey-question",
        "/api/v1/nbol-survey/rater-details",
        "/api/v1/survey/submit-survey",
        "/api/v1/nbol-survey/submit-survey",
        "/api/v1/nbol-survey/single-rater-details",
        "/api/v1/nbol-survey/single-rater-submit",
        "/api/v1/nbol-survey/single/rater-submit",
        "/api/v1/reports/pdf/(.*)",
        "/api/v1/reports/single-response-report/(.*)",
        "/api/v1/reports/dual-gap/report/(.*)",
        "/api/v1/reports/dual-gap/report/download-report(.*)",
        "/api/v1/reports/dual-gap/composit-report(.*)",
        "/api/v1/reports/dual-gap/composit-content(.*)",
        "/api/v1/reports/dual-gap/content(.*)",
        "/api/v1//test-mail/(.*)"
      )
      .forRoutes("*")
      .apply(TenantMiddleware)
      .exclude(
        "/media(.*)",
        "/report(.*)",
        "/api/v1/tenant(.*)",
        "/api/v1/auth(.*)",
        "/api/v1/survey/decode-token/(.*)",
        "/api/v1/survey/submit-survey",
        "/api/v1/nbol-survey/submit-survey",
        "/api/v1/reports/pdf/(.*)",
        "/api/v1/reports/single-response-report/(.*)",
        "/api/v1/reports/dual-gap/report/(.*)",
        "/api/v1/reports/dual-gap/composit-report(.*)",
        "/api/v1//test-mail/(.*)"
      )
      .forRoutes("*");
  }
}
