import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { Queue } from "bull";
import {
  ALTERNATIVE_SUGGESTION_REQUEST,
  COMPOSIT_REPORT,
  MAILS_QUEUE,
  REPORT,
  RESPONDENT_APPROVAL_REQUEST,
  SELF_SURVEY,
  SEND_TOKEN,
  SURVEY,
  SURVEY_ALERT,
  TENANT_REGISTRATION,
  TENANT_SUBSCRIPTION_ALERT,
  SURVEY_PROGRESS_MAIL,
  SINGLE_SURVEY_PROGRESS_MAIL,
  Test_Mail,
  SEND_OTP,
} from "./constants";

import { MailType } from "./types";

@Injectable()
export class MailsService {
  constructor(@InjectQueue(MAILS_QUEUE) private readonly mailQueue: Queue) {}

  async sendTokens(tokens: string[]) {
    try {
      await this.mailQueue.add(SEND_TOKEN, {
        tokens: `[${tokens.join(", ")}]`,
      });
    } catch (error) {
      console.log(error);

      console.log("Error while adding task for " + SEND_TOKEN + "email");
    }
  }

  async TenantRegisterMail(body: MailType) {
    try {
      await this.mailQueue.add(TENANT_REGISTRATION, body);
    } catch (error) {
      console.log(error);

      console.log(
        "Error while adding task for " + TENANT_REGISTRATION + "email"
      );
    }
  }

  async SelfSurveyMail(body: MailType) {
    try {
      await this.mailQueue.add(SELF_SURVEY, body);
    } catch (error) {
      console.log(error);

      console.log("Error while adding task for " + SELF_SURVEY + "email");
    }
  }

  async SurveyMail(body: MailType) {
    try {
      await this.mailQueue.add(SURVEY, body);
    } catch (error) {
      console.log(error);

      console.log("Error while adding task for " + SURVEY + " email");
    }
  }

  async SurveyAlertMail(body: MailType) {
    try {
      await this.mailQueue.add(SURVEY_ALERT, body);
    } catch (error) {
      console.log(error);

      console.log("Error while adding task for " + SURVEY_ALERT + "email");
    }
  }
  async TestMail(body: MailType) {
    try {
      await this.mailQueue.add(Test_Mail, body);
    } catch (error) {
      console.log(error);

      console.log("Error while adding task for " + Test_Mail + "email");
    }
  }

  async RespondentApprovalRequestMail(body: MailType) {
    try {
      await this.mailQueue.add(RESPONDENT_APPROVAL_REQUEST, body);
    } catch (error) {
      console.log(error);

      console.log(
        "Error while adding task for " + RESPONDENT_APPROVAL_REQUEST + "email"
      );
    }
  }

  async AlternativeSuggestionRequestMail(body: MailType) {
    try {
      await this.mailQueue.add(ALTERNATIVE_SUGGESTION_REQUEST, body);
    } catch (error) {
      console.log(error);

      console.log(
        "Error while adding task for " +
          ALTERNATIVE_SUGGESTION_REQUEST +
          "email"
      );
    }
  }

  async ReportsMail(body: MailType) {
    try {
      await this.mailQueue.add(REPORT, body);
    } catch (error) {
      console.log(error);

      console.log("Error while adding task for " + REPORT + "email");
    }
  }

  async CompositReportMail(body: MailType) {
    try {
      await this.mailQueue.add(COMPOSIT_REPORT, body);
    } catch (error) {
      console.log(error);

      console.log("Error while adding task for " + REPORT + "email");
    }
  }

  async TenantSubscriptionAlertMail(body: MailType) {
    try {
      await this.mailQueue.add(TENANT_SUBSCRIPTION_ALERT, body);
    } catch (error) {
      console.log(error);

      console.log(
        "Error while adding task for " + TENANT_SUBSCRIPTION_ALERT + "email"
      );
    }
  }
  async DailySurveyProgressMail(body: MailType) {
    try {
      await this.mailQueue.add(SURVEY_PROGRESS_MAIL, body);
    } catch (error) {
      console.log(error);

      console.log(
        "Error while adding task for " + SURVEY_PROGRESS_MAIL + "email"
      );
    }
  }
  async DailySingleSurveyProgressMail(body: MailType) {
    try {
      await this.mailQueue.add(SINGLE_SURVEY_PROGRESS_MAIL, body);
    } catch (error) {
      console.log(error);

      console.log(
        "Error while adding task for " + SINGLE_SURVEY_PROGRESS_MAIL + "email"
      );
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
      console.log(error);

      console.log("Error while adding task for " + SEND_OTP + "email");
    }
  }
}
