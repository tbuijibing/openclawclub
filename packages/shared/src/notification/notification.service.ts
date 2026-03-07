import { Injectable, Logger } from '@nestjs/common';
import type {
  EmailNotification,
  InAppNotification,
  NotificationResult,
} from './notification.types';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * Send an email notification.
   * Currently a skeleton — actual email transport (SMTP, SES, etc.)
   * will be integrated in a later task.
   */
  async sendEmail(notification: EmailNotification): Promise<NotificationResult> {
    this.logger.log(
      `[Email] To: ${notification.to}, Subject: ${notification.subject}, Lang: ${notification.language}`,
    );

    // TODO: integrate actual email transport (e.g., nodemailer, AWS SES)
    return {
      success: true,
      channel: 'email',
      messageId: `email_${Date.now()}`,
    };
  }

  /**
   * Send an in-app notification (stored for user to read in the notification center).
   * Currently a skeleton — actual persistence will be added when the
   * notification storage table is created.
   */
  async sendInApp(notification: InAppNotification): Promise<NotificationResult> {
    this.logger.log(
      `[InApp] User: ${notification.userId}, Title: ${notification.title}, Type: ${notification.type}`,
    );

    // TODO: persist to notifications table and push via WebSocket
    return {
      success: true,
      channel: 'in_app',
      messageId: `inapp_${Date.now()}`,
    };
  }

  /**
   * Send a notification through multiple channels at once.
   * Useful for important events like ticket updates (Req 11.5: email + in-app).
   */
  async sendMultiChannel(
    email: EmailNotification | null,
    inApp: InAppNotification | null,
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    if (email) {
      results.push(await this.sendEmail(email));
    }
    if (inApp) {
      results.push(await this.sendInApp(inApp));
    }

    return results;
  }
}
