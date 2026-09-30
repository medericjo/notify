import { NotificationProvider, NotificationRecipient } from "../types.js";

export interface EmailProviderOptions {
  send: (params: {
    to: string;
    topic: string;
    data?: Record<string, unknown>;
  }) => Promise<{ messageId?: string }>;
}

export class EmailProvider implements NotificationProvider {
  constructor(private readonly options: EmailProviderOptions) {}

  async send(
    topic: string,
    recipient: NotificationRecipient,
    data?: Record<string, unknown>,
  ) {
    if (!recipient.email) {
      throw new Error("Recipient does not have an email address");
    }

    return this.options.send({
      to: recipient.email,
      topic,
      data,
    });
  }
}
