import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { Queue } from "bull";
import {
  ALTERNATIVE_SUGGESTION_REQUEST,
  MAILS_QUEUE,
  REPORT,
  RESPONDENT_APPROVAL_REQUEST,
  SELF_SURVEY,
  SEND_MAIL,
  SEND_OTP,
  SEND_TOKEN,
  SURVEY,
  SURVEY_ALERT,
  TENANT_REGISTRATION,
  TENANT_SUBSCRIPTION_ALERT,
} from "./constants";

import { MailType } from "./types";

@Injectable()
export class MailsService {
  constructor(@InjectQueue(MAILS_QUEUE) private readonly mailQueue: Queue) {}

  async sendTokens(tokens: string[]) {
    try {
      await this.mailQueue.add(
        SEND_TOKEN,
        {
          tokens: `[${tokens.join(", ")}]`,
        },
        {
          removeOnComplete: true,
          delay: 500,
        }
      );
    } catch (error) {
      console.log("Error while adding task for " + SEND_TOKEN + "email");
    }
  }

  async TenantRegisterMail(body: MailType) {
    try {
      await this.mailQueue.add(TENANT_REGISTRATION, body, {
        removeOnComplete: true,
        delay: 500,
      });
    } catch (error) {
      console.log(
        "Error while adding task for " + TENANT_REGISTRATION + "email"
      );
    }
  }

  async SelfSurveyMail(body: MailType) {
    try {
      await this.mailQueue.add(SELF_SURVEY, body, {
        removeOnComplete: true,
        delay: 500,
      });
    } catch (error) {
      console.log("Error while adding task for " + SELF_SURVEY + "email");
    }
  }

  async SurveyMail(body: MailType) {
    try {
      await this.mailQueue.add(SURVEY, body, {
        removeOnComplete: true,
        delay: 500,
      });
    } catch (error) {
      console.log("Error while adding task for " + SURVEY + "email");
    }
  }

  async SurveyAlertMail(body: MailType) {
    try {
      await this.mailQueue.add(SURVEY_ALERT, body, {
        removeOnComplete: true,
        delay: 500,
      });
    } catch (error) {
      console.log("Error while adding task for " + SURVEY_ALERT + "email");
    }
  }

  async RespondentApprovalRequestMail(body: MailType) {
    try {
      await this.mailQueue.add(RESPONDENT_APPROVAL_REQUEST, body, {
        removeOnComplete: true,
        delay: 500,
      });
    } catch (error) {
      console.log(
        "Error while adding task for " + RESPONDENT_APPROVAL_REQUEST + "email"
      );
    }
  }

  async AlternativeSuggestionRequestMail(body: MailType) {
    try {
      await this.mailQueue.add(ALTERNATIVE_SUGGESTION_REQUEST, body, {
        removeOnComplete: true,
        delay: 500,
      });
    } catch (error) {
      console.log(
        "Error while adding task for " +
          ALTERNATIVE_SUGGESTION_REQUEST +
          "email"
      );
    }
  }

  async ReportsMail(body: MailType) {
    try {
      await this.mailQueue.add(REPORT, body, {
        removeOnComplete: true,
        delay: 500,
      });
    } catch (error) {
      console.log("Error while adding task for " + REPORT + "email");
    }
  }

  async TenantSubscriptionAlertMail(body: MailType, expired: boolean = false) {
    try {
      await this.mailQueue.add(
        TENANT_SUBSCRIPTION_ALERT,
        { ...body, expired },
        {
          removeOnComplete: true,
          delay: 500,
        }
      );
    } catch (error) {
      console.log(
        "Error while adding task for " + TENANT_SUBSCRIPTION_ALERT + "email"
      );
    }
  }

  async SendMail(body: MailType) {
    try {
      await this.mailQueue.add(
        SEND_MAIL,
        { ...body },
        {
          removeOnComplete: true,
          delay: 500,
        }
      );
    } catch (error) {
      console.log("Error while adding task for " + SEND_MAIL + "email");
    }
  }

  async SendOTP(body: MailType) {
    try {
      await this.mailQueue.add(
        SEND_OTP,
        { ...body },
        {
          removeOnComplete: true,
          delay: 500,
        }
      );
    } catch (error) {
      console.log("Error while adding task for " + SEND_OTP + "email");
    }
  }
}
