import { renderTemplate, type TemplateRegistry } from "../../templates.js";
import type {
  NotificationProvider,
  NotificationRecipient,
} from "../../types.js";
import type { EmailTransport, OutboundEmail } from "./transport.js";

export class EmailChannel implements NotificationProvider {
  private transport?: EmailTransport;

  constructor(
    private readonly resolveTransport: () => EmailTransport,
    private readonly registry: TemplateRegistry,
  ) {}

  async send(
    topic: string,
    recipient: NotificationRecipient,
    data?: Record<string, unknown>,
  ) {
    if (!recipient.email) {
      throw new Error("Recipient does not have an email address");
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

    const message: OutboundEmail = {
      to: recipient.email,
      subject: renderTemplate(template.subject, context),
      text: renderTemplate(template.text, context),
    };
    if (template.html) {
      message.html = renderTemplate(template.html, context);
    }

    this.transport ??= this.resolveTransport();
    return this.transport.send(message);
  }
}
