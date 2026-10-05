import type { LeTextoConfig } from "./letexto.js";
import type { OrangeSmsConfig } from "./orange.js";

export type SmsConfig =
  | { provider: "orange"; orange: OrangeSmsConfig }
  | { provider: "letexto"; letexto: LeTextoConfig };

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

  if (provider === "letexto") {
    return {
      provider: "letexto",
      letexto: {
        token: required(env, "LETEXTO_API_TOKEN"),
        sender: required(env, "LETEXTO_SENDER"),
        dlrUrl: env.LETEXTO_DLR_URL || undefined,
        dlrMethod: dlrMethod(env.LETEXTO_DLR_METHOD),
      },
    };
  }

  throw new Error(`Unknown sms provider: ${provider}`);
}

function dlrMethod(value: string | undefined): "GET" | "POST" | undefined {
  if (!value) {
    return undefined;
  }
  if (value === "GET" || value === "POST") {
    return value;
  }
  throw new Error("Invalid environment variable: LETEXTO_DLR_METHOD");
}
