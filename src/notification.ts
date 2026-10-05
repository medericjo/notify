import { EmailChannel } from "./providers/email/channel.js";
import { createEmailTransport } from "./providers/email/create-email-transport.js";
import { SmsChannel } from "./providers/sms/channel.js";
import { createSmsTransport } from "./providers/sms/create-sms-transport.js";
import { templates, type TemplateRegistry } from "./templates.js";
import {
  NotificationChannel,
  NotificationProvider,
  NotificationRequest,
  NotificationResult,
} from "./types.js";

export interface NotificationConfig {
  providers: Partial<Record<NotificationChannel, NotificationProvider>>;
}

export class Notification {
  constructor(private readonly config: NotificationConfig) {}

  async send(request: NotificationRequest): Promise<NotificationResult[]> {
    const results = await Promise.all(
      request.channels.map((channel) => this.sendChannel(channel, request)),
    );

    return results;
  }

  private async sendChannel(
    channel: NotificationChannel,
    request: NotificationRequest,
  ): Promise<NotificationResult> {
    const provider = this.config.providers[channel];

    if (!provider) {
      return {
        channel,
        success: false,
        error: new Error(`No provider configured for channel: ${channel}`),
      };
    }

    try {
      const result = await provider.send(
        request.topic,
        request.recipient,
        request.data,
      );

      return {
        channel,
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      return {
        channel,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

export function createNotification(
  env: NodeJS.ProcessEnv = process.env,
  registry: TemplateRegistry = templates,
): Notification {
  return new Notification({
    providers: {
      email: new EmailChannel(() => createEmailTransport(env), registry),
      sms: new SmsChannel(() => createSmsTransport(env), registry),
    },
  });
}

let defaultNotification: Notification | undefined;

export const notification = {
  send(request: NotificationRequest): Promise<NotificationResult[]> {
    defaultNotification ??= createNotification();
    return defaultNotification.send(request);
  },
};
