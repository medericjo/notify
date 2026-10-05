import { describe, expect, it, vi } from "vitest";
import { createSmtpTransport } from "../src/providers/email/smtp.js";

const smtpConfig = {
  host: "smtp.example.com",
  port: 587,
  secure: false,
  user: "notifications@example.com",
  pass: "secret",
  from: "notifications@example.com",
};

describe("createSmtpTransport", () => {
  it("envoie le message via SMTP et renvoie le messageId", async () => {
    const sendMail = vi.fn(async () => ({ messageId: "smtp-1" }));
    const transport = createSmtpTransport(smtpConfig, { sendMail });

    const result = await transport.send({
      to: "ada@example.com",
      subject: "Test Ada",
      text: "Bonjour Ada",
      html: "<p>Ada</p>",
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: "notifications@example.com",
      to: "ada@example.com",
      subject: "Test Ada",
      text: "Bonjour Ada",
      html: "<p>Ada</p>",
    });
    expect(result).toEqual({ messageId: "smtp-1" });
  });
});
