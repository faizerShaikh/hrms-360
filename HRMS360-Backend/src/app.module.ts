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
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ResponseInterceptor } from "./common/interceptors";
import { RequestParamsModule } from "./common/modules/requestParams";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TenantMiddleware } from "./common/middlewares/tenant.middleware";
import { SequelizeModule } from "@nestjs/sequelize";
import { Tenant, TenantUser } from "./modules/tenants/models";
import { ApsisUser } from "./modules/apsis/module/apsisUser/model";
import { User } from "./modules/users/models";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { SettingsModule } from "./modules/settings/app/settings.module";
import { ChannelPartnerModule } from "./modules/tenants/modules/channelPartner/app/channelPartner.module";
import { MailsModule } from "./common/modules/mails";
import { CronjobModule } from "./common/modules/cronjob/cronjob.module";
import { EmployeeDirectoryModule } from "./modules/employee-directory/employeeDirectory.module";
import { ApsisReportsModule } from "./modules/apsis/module/reports/reports.module";
import { BullModule } from "@nestjs/bull";
import { databaseConfig } from "./config";
import { GlobalJwtModule, publicTables, schemaTables } from "./common/modules";
import { JwtAuthGuard } from "./common/guards";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get("REDIS_HOST"),
          lazyConnect: false,
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
    ConfigModule.forRoot({ isGlobal: true }),
    GlobalJwtModule,
    SequelizeModule.forFeature([Tenant, ApsisUser, User, TenantUser]),
    RequestParamsModule,
    TenantsModule,
    QuestionModule,
    UsersModule,
    SurveyModule,
    ReportsModule,
    QuestionnaireModule,
    DashboardModule,
    CompetencyModule,
    AuthModule,
    SettingsModule,
    ChannelPartnerModule,
    MailsModule,
    EmployeeDirectoryModule,
    CronjobModule,
    ApsisReportsModule,
  ],
  exports: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        "/media(.*)",
        "/report(.*)",
        "/api/v1/tenant(.*)",
        "/api/v1/auth(.*)",
        "/api/v1/survey/detail/(.*)",
        "/api/v1/admin-reports/(.*)",
        "/api/v1/survey/single-detail/(.*)",
        "/api/v1/survey/multiple-detail/(.*)",
        "/api/v1/survey/submit-survey",
        "/api/v1/survey/submit-survey-single-ratee",
        "/api/v1/reports/pdf/(.*)",
        "/api/v1/reports/single-response-report/(.*)",
        "/api/v1/setting/industry/apsis-admin"
      )
      .forRoutes("*");
  }
}
