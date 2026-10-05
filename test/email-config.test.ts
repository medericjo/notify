import { describe, expect, it } from "vitest";
import { readEmailConfig } from "../src/providers/email/config.js";

describe("readEmailConfig", () => {
  it("lit la configuration SMTP", () => {
    expect(
      readEmailConfig({
        EMAIL_PROVIDER: "smtp",
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "465",
        SMTP_SECURE: "true",
        SMTP_USER: "notifications@example.com",
        SMTP_PASS: "secret",
        SMTP_FROM: "notifications@example.com",
      }),
    ).toEqual({
      provider: "smtp",
      smtp: {
        host: "smtp.example.com",
        port: 465,
        secure: true,
        user: "notifications@example.com",
        pass: "secret",
        from: "notifications@example.com",
      },
    });
  });

  it("utilise le port 587 sans TLS implicite par défaut", () => {
    const config = readEmailConfig({
      EMAIL_PROVIDER: "smtp",
      SMTP_HOST: "smtp.example.com",
      SMTP_USER: "notifications@example.com",
      SMTP_PASS: "secret",
      SMTP_FROM: "notifications@example.com",
    });

    expect(config).toMatchObject({
      provider: "smtp",
      smtp: { port: 587, secure: false },
    });
  });

  it("lit la configuration Resend", () => {
    expect(
      readEmailConfig({
        EMAIL_PROVIDER: "resend",
        RESEND_API_KEY: "re_test",
        EMAIL_FROM: "notifications@example.com",
      }),
    ).toEqual({
      provider: "resend",
      resend: {
        apiKey: "re_test",
        from: "notifications@example.com",
      },
    });
  });

  it("signale une variable absente", () => {
    expect(() => readEmailConfig({ EMAIL_PROVIDER: "smtp" })).toThrow(
      "Missing environment variable: SMTP_HOST",
    );
  });

  it("signale un provider inconnu", () => {
    expect(() => readEmailConfig({ EMAIL_PROVIDER: "mailgun" })).toThrow(
      "Unknown email provider: mailgun",
    );
  });

  it("signale l'absence de EMAIL_PROVIDER", () => {
    expect(() => readEmailConfig({})).toThrow(
      "Missing environment variable: EMAIL_PROVIDER",
    );
  });
});
