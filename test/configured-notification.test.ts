import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMail, createTransport } = vi.hoisted(() => {
  const sendMail = vi.fn(async () => ({ messageId: "smtp-1" }));
  const createTransport = vi.fn(() => ({ sendMail }));
  return { sendMail, createTransport };
});

vi.mock("nodemailer", () => ({
  default: { createTransport },
}));

import { createNotification } from "../src/notification.js";
import { TemplateRegistry } from "../src/templates.js";

const smtpEnv = {
  EMAIL_PROVIDER: "smtp",
  SMTP_HOST: "smtp.example.com",
  SMTP_PORT: "587",
  SMTP_USER: "notifications@example.com",
  SMTP_PASS: "secret",
  SMTP_FROM: "notifications@example.com",
};

describe("createNotification", () => {
  beforeEach(() => {
    sendMail.mockClear();
    createTransport.mockClear();
  });

  it("envoie un email à partir du type, sans transport fourni par l'appelant", async () => {
    const registry = new TemplateRegistry();
    registry.register("topic.test", {
      subject: "Test {{name}}",
      text: "Bonjour {{name}}",
    });
    const notification = createNotification(smtpEnv, registry);

    const results = await notification.send({
      topic: "topic.test",
      recipient: {
        id: "user-1",
        email: "ada@example.com",
        name: "Ada",
      },
      channels: ["email"],
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: {
        user: "notifications@example.com",
        pass: "secret",
      },
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: "notifications@example.com",
      to: "ada@example.com",
      subject: "Test Ada",
      text: "Bonjour Ada",
    });
    expect(results).toEqual([
      { channel: "email", success: true, messageId: "smtp-1" },
    ]);
  });

  it("renvoie l'échec de configuration dans le résultat du canal", async () => {
    const registry = new TemplateRegistry();
    registry.register("topic.test", {
      subject: "Test",
      text: "Bonjour",
    });
    const notification = createNotification({}, registry);

    const results = await notification.send({
      topic: "topic.test",
      recipient: { email: "ada@example.com" },
      channels: ["email"],
    });

    expect(results[0]?.success).toBe(false);
    expect(results[0]?.error?.message).toBe(
      "Missing environment variable: EMAIL_PROVIDER",
    );
    expect(sendMail).not.toHaveBeenCalled();
  });
});
