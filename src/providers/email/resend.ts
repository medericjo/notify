import { Resend } from "resend";
import type { EmailTransport } from "./transport.js";

export interface ResendConfig {
  apiKey: string;
  from: string;
}

export interface ResendMailer {
  emails: {
    send(payload: {
      from: string;
      to: string;
      subject: string;
      text: string;
      html?: string;
    }): Promise<{
      data: { id: string } | null;
      error: { message: string } | null;
    }>;
  };
}

export function createResendTransport(
  config: ResendConfig,
  client?: ResendMailer,
): EmailTransport {
  const resend: ResendMailer = client ?? new Resend(config.apiKey);

  return {
    async send(message) {
      const { data, error } = await resend.emails.send({
        from: config.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      });

      if (error) {
        throw new Error(error.message);
      }

      return { messageId: data?.id };
    },
  };
}
