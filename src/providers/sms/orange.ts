import { normalizeIvoryCoastPhone } from "./phone.js";
import type { SmsTransport } from "./transport.js";

const TOKEN_URL = "https://api.orange.com/oauth/v3/token";
const SMS_URL = "https://api.orange.com/smsmessaging/v1/outbound";
const MAX_LENGTH = 160;

export interface OrangeSmsConfig {
  basicAuth: string;
  senderAddress: string;
  senderName: string;
}

export type HttpRequest = (
  url: string,
  init?: RequestInit,
) => Promise<Response>;

export function createOrangeSmsTransport(
  config: OrangeSmsConfig,
  fetchImpl: HttpRequest = fetch,
): SmsTransport {
  let cachedToken: { value: string; expiresAt: number } | undefined;

  return {
    async send(message) {
      const text = message.text.trim();
      if (!text) {
        throw new Error("Message cannot be empty");
      }
      if (text.length > MAX_LENGTH) {
        throw new Error("Message too long. Maximum 160 characters allowed");
      }

      const to = normalizeIvoryCoastPhone(message.to);
      const accessToken = await getAccessToken();
      const response = await fetchImpl(
        `${SMS_URL}/${config.senderAddress}/requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            outboundSMSMessageRequest: {
              address: [`tel:${to}`],
              senderAddress: config.senderAddress,
              senderName: config.senderName,
              outboundSMSTextMessage: { message: text },
            },
          }),
        },
      );
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(
          `Orange SMS request failed (${response.status}): ${errorMessage(body) ?? "Unknown error"}`,
        );
      }

      return { messageId: resourceUrl(body) };
    },
  };

  async function getAccessToken(): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      return cachedToken.value;
    }

    const response = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: config.basicAuth,
      },
      body: "grant_type=client_credentials",
    });
    const body = await readJson(response);
    if (!response.ok || !isRecord(body) || typeof body.access_token !== "string") {
      throw new Error(
        `Failed to get Orange SMS access token: ${errorMessage(body) ?? response.statusText}`,
      );
    }

    const expiresIn = typeof body.expires_in === "number" ? body.expires_in : 0;
    if (expiresIn > 60) {
      cachedToken = {
        value: body.access_token,
        expiresAt: Date.now() + (expiresIn - 60) * 1000,
      };
    }

    return body.access_token;
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(
      `Orange SMS returned an unreadable response (${response.status})`,
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(body: unknown): string | undefined {
  if (!isRecord(body)) {
    return undefined;
  }

  const message = body.message ?? body.error_description;
  const code = body.code ?? body.error;
  if (typeof code === "string" && typeof message === "string") {
    return `${code}: ${message}`;
  }
  if (typeof message === "string") {
    return message;
  }
  if (typeof code === "string") {
    return code;
  }
  return undefined;
}

function resourceUrl(body: unknown): string | undefined {
  if (!isRecord(body) || !isRecord(body.outboundSMSMessageRequest)) {
    return undefined;
  }

  const reference = body.outboundSMSMessageRequest.resourceReference;
  if (!isRecord(reference) || typeof reference.resourceURL !== "string") {
    return undefined;
  }

  return reference.resourceURL;
}
