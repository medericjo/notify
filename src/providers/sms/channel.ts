import { renderTemplate, type TemplateRegistry } from "../../templates.js";
import type {
  NotificationProvider,
  NotificationRecipient,
} from "../../types.js";
import type { SmsTransport } from "./transport.js";

export class SmsChannel implements NotificationProvider {
  private transport?: SmsTransport;

  constructor(
    private readonly resolveTransport: () => SmsTransport,
    private readonly registry: TemplateRegistry,
  ) {}

  async send(
    topic: string,
    recipient: NotificationRecipient,
    data?: Record<string, unknown>,
  ) {
    if (!recipient.phone) {
      throw new Error("Recipient does not have a phone number");
    }

    const template = this.registry.get(topic);
    if (!template) {
      throw new Error(`No template registered for topic: ${topic}`);
    }

    const context: Record<string, unknown> = {
      id: recipient.id,
      email: recipient.email,
      phone: recipient.phone,
      name: recipient.name,
      ...data,
    };

    this.transport ??= this.resolveTransport();
    return this.transport.send({
      to: recipient.phone,
      text: renderTemplate(template.sms ?? template.text, context),
    });
  }
}
