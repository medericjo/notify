import nodemailer from "nodemailer";
import type { EmailTransport, OutboundEmail } from "./transport.js";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export interface SmtpMailer {
  sendMail(
    message: OutboundEmail & { from: string },
  ): Promise<{ messageId?: string }>;
}

export function createSmtpTransport(
  config: SmtpConfig,
  mailer?: SmtpMailer,
): EmailTransport {
  const client: SmtpMailer =
    mailer ??
    nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

  return {
    async send(message) {
      const info = await client.sendMail({
        from: config.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      });
      return { messageId: info.messageId };
    },
  };
}
