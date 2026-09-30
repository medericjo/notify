import { NotificationProvider, NotificationRecipient } from "../types.js";

export interface SmsProviderOptions {
  send: (params: {
    to: string;
    topic: string;
    data?: Record<string, unknown>;
  }) => Promise<{ messageId?: string }>;
}

export class SmsProvider implements NotificationProvider {
  constructor(private readonly options: SmsProviderOptions) {}

  async send(
    topic: string,
    recipient: NotificationRecipient,
    data?: Record<string, unknown>,
  ) {
    if (!recipient.phone) {
      throw new Error("Recipient does not have a phone number");
    }

    return this.options.send({
      to: recipient.phone,
      topic,
      data,
    });
  }
}
