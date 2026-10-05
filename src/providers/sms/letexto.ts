import { normalizeInternationalPhone } from "./phone.js";
import type { SmsTransport } from "./transport.js";

const SEND_URL = "https://apis.letexto.com/v1/messages/send";

export interface LeTextoConfig {
  token: string;
  sender: string;
  dlrUrl?: string;
  dlrMethod?: "GET" | "POST";
}

type HttpRequest = (url: string, init?: RequestInit) => Promise<Response>;

export function createLeTextoTransport(
  config: LeTextoConfig,
  fetchImpl: HttpRequest = fetch,
): SmsTransport {
  return {
    async send(message) {
      const content = message.text.trim();
      if (!content) {
        throw new Error("Message cannot be empty");
      }

      const to = normalizeInternationalPhone(message.to);
      const response = await fetchImpl(SEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: config.sender,
          to,
          content,
          ...(config.dlrUrl ? { dlrUrl: config.dlrUrl } : {}),
          ...(config.dlrMethod ? { dlrMethod: config.dlrMethod } : {}),
        }),
      });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(
          `LeTexto request failed (${response.status}): ${errorMessage(body) ?? "Unknown error"}`,
        );
      }

      return { messageId: messageId(body) };
    },
  };
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
      `LeTexto returned an unreadable response (${response.status})`,
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

  const message = body.message ?? body.error_description ?? body.error;
  return typeof message === "string" ? message : undefined;
}

function messageId(body: unknown): string | undefined {
  if (!isRecord(body)) {
    return undefined;
  }

  if (typeof body.id === "string" || typeof body.id === "number") {
    return String(body.id);
  }

  return undefined;
}
