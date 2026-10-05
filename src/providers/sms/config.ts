import type { OrangeSmsConfig } from "./orange.js";

export type SmsConfig = { provider: "orange"; orange: OrangeSmsConfig };

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function readSmsConfig(env: NodeJS.ProcessEnv): SmsConfig {
  const provider = env.SMS_PROVIDER;
  if (!provider) {
    throw new Error("Missing environment variable: SMS_PROVIDER");
  }

  if (provider === "orange") {
    return {
      provider: "orange",
      orange: {
        basicAuth: required(env, "ORANGE_SMS_BASIC_AUTH"),
        senderAddress: env.ORANGE_SMS_SENDER_ADDRESS || "tel:+2250000",
        senderName: env.ORANGE_SMS_SENDER_NAME || "AMANEPLUS",
      },
    };
  }

  throw new Error(`Unknown sms provider: ${provider}`);
}
