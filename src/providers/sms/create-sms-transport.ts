import { readSmsConfig } from "./config.js";
import { createLeTextoTransport } from "./letexto.js";
import { createOrangeSmsTransport } from "./orange.js";
import type { SmsTransport } from "./transport.js";

export function createSmsTransport(
  env: NodeJS.ProcessEnv = process.env,
): SmsTransport {
  const config = readSmsConfig(env);
  if (config.provider === "orange") {
    return createOrangeSmsTransport(config.orange);
  }
  return createLeTextoTransport(config.letexto);
}
