import { MailerService } from "@nestjs-modules/mailer";
import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { Job } from "bull";
import {
  MAILS_QUEUE,
  SEND_TOKEN,
  TENANT_REGISTRATION,
  SELF_SURVEY,
  SURVEY,
  SURVEY_ALERT,
  RESPONDENT_APPROVAL_REQUEST,
  ALTERNATIVE_SUGGESTION_REQUEST,
  TENANT_SUBSCRIPTION_ALERT,
  REPORT,
  COMPOSIT_REPORT,
  SURVEY_PROGRESS_MAIL,
  SINGLE_SURVEY_PROGRESS_MAIL,
  Test_Mail,
  SEND_OTP,
} from "./constants";
import { MailType } from "./types";
import { ConfigService } from "@nestjs/config";

@Injectable()
@Processor(MAILS_QUEUE)
export class MailsProcessor {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService
  ) {}

  @Process(SEND_TOKEN)
  async sendTokens(job: Job<{ tokens: string }>) {
    await this.mailerService
      .sendMail({
        to: "meenaz.riyaz@apsissolutions.com",
        template: "surveyTokens",
        subject: "survey tokens",
        context: {
          tokens: job.data.tokens,
        },
      })
      .then(() => {
        console.log("Mail Sent For Self Survey");
      })
      .catch((err) => {
        console.error(err, "send mail Error");
      });
  }

  @Process(TENANT_REGISTRATION)
  async TenantRegisterMail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: job.data?.cc ? `${job.data?.cc}` : "",
        bcc: `${
          this.configService.get("NODE_ENV") !== "uat"
            ? "insight360@nboleadership.com,aatif.sayyed@apsissolutions.com"
            : this.configService.get("NODE_ENV") === "development"
            ? "shoaib.shaikh@apsissolutions.com,arbaz.shaikh@apsissolutions.com"
            : "shoaib.shaikh@apsissolutions.com,aatif.sayyed@apsissolutions.com"
        }`,
        subject: job.data.subject,
        template: "new-nbol/TenantLogin",
        context: {
          ...job.data.context,
        },
        attachments: [...job.data.attachments],
        headers: {
          "X-PM-Message-Stream": "outbound",
        },
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Tenant Register");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  @Process(SELF_SURVEY)
  async SelfSurveyMail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: job.data?.cc ? `${job.data?.cc}` : "",
        bcc: `${
          this.configService.get("NODE_ENV") === "production"
            ? "insight360@nboleadership.com,aatif.sayyed@apsissolutions.com"
            : this.configService.get("NODE_ENV") === "development"
            ? "shoaib.shaikh@apsissolutions.com,arbaz.shaikh@apsissolutions.com"
            : "shoaib.shaikh@apsissolutions.com,aatif.sayyed@apsissolutions.com"
        }`,
        subject: job.data.subject,
        template: "nbol/SelfSurveyMail",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        headers: {
          "X-PM-Message-Stream": "outbound",
        },
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Self Survey");
      })
      .catch((err) => {
        console.error(err, "Self Survey Error");
      });
  }

  @Process(SURVEY)
  async SurveyMail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: job.data?.cc ? `${job.data?.cc}` : "",
        bcc: `${
          this.configService.get("NODE_ENV") === "production"
            ? "insight360@nboleadership.com,aatif.sayyed@apsissolutions.com"
            : this.configService.get("NODE_ENV") === "development"
            ? "shoaib.shaikh@apsissolutions.com,arbaz.shaikh@apsissolutions.com"
            : "shoaib.shaikh@apsissolutions.com,aatif.sayyed@apsissolutions.com"
        }`,
        subject: job.data.subject,
        template: "new-nbol/NbolSurveyParticipation",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        headers: {
          "X-PM-Message-Stream": "outbound",
        },
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Survey", job.data.to);
      })
      .catch((err) => {
        console.error(err, "Survey Mail Error");
      });
  }

  @Process(SURVEY_PROGRESS_MAIL)
  async SurveyAlertMail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: job.data?.cc ? `${job.data?.cc}` : "",
        bcc: `${
          this.configService.get("NODE_ENV") === "production"
            ? "insight360@nboleadership.com,aatif.sayyed@apsissolutions.com"
            : this.configService.get("NODE_ENV") === "development"
            ? "shoaib.shaikh@apsissolutions.com,arbaz.shaikh@apsissolutions.com"
            : "shoaib.shaikh@apsissolutions.com,aatif.sayyed@apsissolutions.com"
        },${job.data?.bcc}`,
        subject: job.data.subject,
        template: "new-nbol/NbolAllSurveyProgress",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        headers: {
          "X-PM-Message-Stream": "outbound",
        },
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Survey Alert");
      })
      .catch((err) => {
        console.error(err);
      });
  }
  @Process(SINGLE_SURVEY_PROGRESS_MAIL)
  async SingleSurveyAlertMail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: job.data?.cc ? `${job.data?.cc}` : "",
        bcc: `${
          this.configService.get("NODE_ENV") === "production"
            ? "insight360@nboleadership.com,aatif.sayyed@apsissolutions.com"
            : this.configService.get("NODE_ENV") === "development"
            ? "shoaib.shaikh@apsissolutions.com,arbaz.shaikh@apsissolutions.com"
            : "shoaib.shaikh@apsissolutions.com,aatif.sayyed@apsissolutions.com"
        }`,
        subject: job.data.subject,
        template: "new-nbol/SurveyProgress",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        headers: {
          "X-PM-Message-Stream": "outbound",
        },
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Survey Alert");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  @Process(SURVEY_ALERT)
  async SurveyProgressMail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: job.data?.cc ? `${job.data?.cc}` : "",
        bcc: `${
          this.configService.get("NODE_ENV") === "production"
            ? "insight360@nboleadership.com,aatif.sayyed@apsissolutions.com"
            : this.configService.get("NODE_ENV") === "development"
            ? "shoaib.shaikh@apsissolutions.com,arbaz.shaikh@apsissolutions.com"
            : "shoaib.shaikh@apsissolutions.com,aatif.sayyed@apsissolutions.com"
        }`,
        subject: job.data.subject,
        template: "SurveyAlertMail",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        headers: {
          "X-PM-Message-Stream": "outbound",
        },
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Survey Alert");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  @Process(Test_Mail)
  async Test_Mail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: job.data?.cc ? `${job.data?.cc}` : "",
        bcc: `${
          this.configService.get("NODE_ENV") === "production"
            ? "insight360@nboleadership.com,aatif.sayyed@apsissolutions.com"
            : this.configService.get("NODE_ENV") === "development"
            ? "shoaib.shaikh@apsissolutions.com,arbaz.shaikh@apsissolutions.com"
            : ""
        }`,
        subject: job.data.subject,
        template: "TestMail",
        ...job.data,
      })
      .then(() => {
        console.log("Test Mail Sent");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  @Process(RESPONDENT_APPROVAL_REQUEST)
  async RespondentApprovalRequestMail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: job.data?.cc ? `${job.data?.cc}` : "",
        bcc: `${
          this.configService.get("NODE_ENV") === "production"
            ? "insight360@nboleadership.com,aatif.sayyed@apsissolutions.com"
            : this.configService.get("NODE_ENV") === "development"
            ? "shoaib.shaikh@apsissolutions.com,arbaz.shaikh@apsissolutions.com"
            : "shoaib.shaikh@apsissolutions.com,aatif.sayyed@apsissolutions.com"
        }`,
        subject: job.data.subject,
        template: "RespondentApprovalRequest",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        headers: {
          "X-PM-Message-Stream": "outbound",
        },
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Respondent Approval Request");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  @Process(ALTERNATIVE_SUGGESTION_REQUEST)
  async AlternativeSuggestionRequestMail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: job.data?.cc ? `${job.data?.cc}` : "",
        bcc: `${
          this.configService.get("NODE_ENV") === "production"
            ? "insight360@nboleadership.com,aatif.sayyed@apsissolutions.com"
            : this.configService.get("NODE_ENV") === "development"
            ? "shoaib.shaikh@apsissolutions.com,arbaz.shaikh@apsissolutions.com"
            : "shoaib.shaikh@apsissolutions.com,aatif.sayyed@apsissolutions.com"
        }`,
        subject: job.data.subject,
        template: "AlternativeSuggestionRequest",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        headers: {
          "X-PM-Message-Stream": "outbound",
        },
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Alternative Suggestion Request");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  @Process(REPORT)
  async ReportsMail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: job.data?.cc ? `${job.data?.cc}` : "",
        bcc: `${
          this.configService.get("NODE_ENV") === "production"
            ? "insight360@nboleadership.com,aatif.sayyed@apsissolutions.com"
            : this.configService.get("NODE_ENV") === "development"
            ? "shoaib.shaikh@apsissolutions.com,arbaz.shaikh@apsissolutions.com"
            : "shoaib.shaikh@apsissolutions.com,aatif.sayyed@apsissolutions.com"
        }`,
        subject: job.data.subject,
        template: "ReportDownloadMail",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        headers: {
          "X-PM-Message-Stream": "outbound",
        },
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Reports Download");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  @Process(COMPOSIT_REPORT)
  async CompositReportMail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: job.data?.cc ? `${job.data?.cc}` : "",
        bcc: `${
          this.configService.get("NODE_ENV") === "production"
            ? "insight360@nboleadership.com,aatif.sayyed@apsissolutions.com"
            : this.configService.get("NODE_ENV") === "development"
            ? "shoaib.shaikh@apsissolutions.com,arbaz.shaikh@apsissolutions.com"
            : "shoaib.shaikh@apsissolutions.com,aatif.sayyed@apsissolutions.com"
        },${job.data?.bcc}`,
        subject: job.data.subject,
        template: "new-nbol/compositReportDownloadMail2",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        headers: {
          "X-PM-Message-Stream": "outbound",
        },
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Reports Download");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  @Process(TENANT_SUBSCRIPTION_ALERT)
  async TenantSubscriptionAlertMail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: job.data?.cc ? `${job.data?.cc}` : "",
        bcc: `${
          this.configService.get("NODE_ENV") === "production"
            ? "insight360@nboleadership.com,aatif.sayyed@apsissolutions.com"
            : this.configService.get("NODE_ENV") === "development"
            ? "shoaib.shaikh@apsissolutions.com,arbaz.shaikh@apsissolutions.com"
            : "shoaib.shaikh@apsissolutions.com,aatif.sayyed@apsissolutions.com"
        }`,
        subject: job.data.subject,
        template: "TenantSubscriptionAlertMail",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        headers: {
          "X-PM-Message-Stream": "outbound",
        },
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Tenant Subscription Alert");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  @Process(SEND_OTP)
  async SendOTP(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: job.data?.cc ? `${job.data?.cc}` : "",
        bcc: "aatif.sayyed@apsissolutions.com,insight360@nboleadership.com",
        subject: "Test Survey",
        template: job.data.template,
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        headers: {
          "X-PM-Message-Stream": "outbound",
        },
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Tenant Subscription Alert");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  @OnQueueActive()
  public onActive(job: Job) {
    console.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  public onComplete(job: Job) {
    console.log(`Completed job ${job.id} of type ${job.name}`);
  }

  @OnQueueFailed()
  public onError(job: Job<any>, error: any) {
    console.log(
      `Failed job ${job.id} of type ${job.name}: ${error.message}`,
      error.stack
    );
  }
}
