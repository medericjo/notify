import type { ResendConfig } from "./resend.js";
import type { SmtpConfig } from "./smtp.js";

export type EmailConfig =
  | { provider: "smtp"; smtp: SmtpConfig }
  | { provider: "resend"; resend: ResendConfig };

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function readEmailConfig(env: NodeJS.ProcessEnv): EmailConfig {
  const provider = env.EMAIL_PROVIDER;
  if (!provider) {
    throw new Error("Missing environment variable: EMAIL_PROVIDER");
  }

  if (provider === "smtp") {
    const port = env.SMTP_PORT ? Number(env.SMTP_PORT) : 587;
    if (!Number.isInteger(port)) {
      throw new Error("Invalid environment variable: SMTP_PORT");
    }

    return {
      provider: "smtp",
      smtp: {
        host: required(env, "SMTP_HOST"),
        port,
        secure: env.SMTP_SECURE === "true",
        user: required(env, "SMTP_USER"),
        pass: required(env, "SMTP_PASS"),
        from: required(env, "SMTP_FROM"),
      },
    };
  }

  if (provider === "resend") {
    return {
      provider: "resend",
      resend: {
        apiKey: required(env, "RESEND_API_KEY"),
        from: required(env, "EMAIL_FROM"),
      },
    };
  }

  throw new Error(`Unknown email provider: ${provider}`);
}
