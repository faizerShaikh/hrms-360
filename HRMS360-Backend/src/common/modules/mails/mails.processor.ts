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
  SEND_MAIL,
  SEND_OTP,
} from "./constants";
import { MailType } from "./types";

@Injectable()
@Processor(MAILS_QUEUE)
export class MailsProcessor {
  constructor(private readonly mailerService: MailerService) {}

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
    try {
      await this.mailerService
        .sendMail({
          to: job.data.to,
          cc: "faizershaikh25@gmail.com",
          subject: job.data.subject,
          template: "TenantLogin",
          context: {
            ...job.data.context,
          },
          attachments: [...job.data.attachments],
          ...job.data,
        })
        .then(() => {
          console.log("Mail Sent For Tenant Register");
        })
        .catch((err) => {
          console.error(err);
        });
    } catch (error) {
      console.log(error);
    }
  }

  @Process(SELF_SURVEY)
  async SelfSurveyMail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: "faizershaikh25@gmail.com",
        subject: job.data.subject,
        template: "SelfSurveyMail",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Self Survey");
      })
      .catch((err) => {
        console.log(err, "Self Survey Wala Error");
      });
  }

  @Process(SURVEY)
  async SurveyMail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: "faizershaikh25@gmail.com",
        subject: job.data.subject,
        template: "SurveyMail",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Survey");
      })
      .catch((err) => {
        console.log(err, "Other Survey Wala error");
      });
  }

  @Process(SURVEY_ALERT)
  async SurveyAlertMail(job: Job<MailType>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: "faizershaikh25@gmail.com",
        subject: job.data.subject,
        template: "SurveyAlertMail",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Survey Alert");
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
        cc: "faizershaikh25@gmail.com",
        subject: job.data.subject,
        template: "RespondentApprovalRequest",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
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
        cc: "faizershaikh25@gmail.com",
        subject: job.data.subject,
        template: "AlternativeSuggestionRequest",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
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
    console.log(job);
    // await this.mailerService
    //   .sendMail({
    //     to: job.data.to,
    //     cc: "faizershaikh25@gmail.com",
    //     subject: job.data.subject,
    //     template: "ReportDownloadMail",
    //     context: { ...job.data.context },
    //     attachments: [...job.data.attachments],
    //     ...job.data,
    //   })
    //   .then(() => {
    //     console.log("Mail Sent For Reports Download");
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //   });
  }

  @Process(TENANT_SUBSCRIPTION_ALERT)
  async TenantSubscriptionAlertMail(job: Job<MailType & { expired: boolean }>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: "faizershaikh25@gmail.com",
        subject: job.data.subject,
        template: "TenantSubscriptionAlertMail",
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
        ...job.data,
      })
      .then(() => {
        console.log("Mail Sent For Tenant Subscription Alert");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  @Process(SEND_MAIL)
  async SendMail(job: Job<MailType & { expired: boolean }>) {
    await this.mailerService
      .sendMail({
        to: job.data.to,
        cc: "faizershaikh25@gmail.com",
        subject: "Test Survey",
        template: job.data.template,
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
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
        cc: "faizershaikh25@gmail.com",
        subject: "Test Survey",
        template: job.data.template,
        context: { ...job.data.context },
        attachments: [...job.data.attachments],
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
