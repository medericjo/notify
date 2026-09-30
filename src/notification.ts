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
