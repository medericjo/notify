import { readSmsConfig } from "./config.js";
import { createOrangeSmsTransport } from "./orange.js";
import type { SmsTransport } from "./transport.js";

export function createSmsTransport(
  env: NodeJS.ProcessEnv = process.env,
): SmsTransport {
  const config = readSmsConfig(env);
  return createOrangeSmsTransport(config.orange);
}
