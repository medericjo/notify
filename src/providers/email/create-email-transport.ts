import { readEmailConfig } from "./config.js";
import { createResendTransport } from "./resend.js";
import { createSmtpTransport } from "./smtp.js";
import type { EmailTransport } from "./transport.js";

export function createEmailTransport(
  env: NodeJS.ProcessEnv = process.env,
): EmailTransport {
  const config = readEmailConfig(env);
  if (config.provider === "smtp") {
    return createSmtpTransport(config.smtp);
  }
  return createResendTransport(config.resend);
}
