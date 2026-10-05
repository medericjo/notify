import { describe, expect, it, vi } from "vitest";
import { createOrangeSmsTransport } from "../src/providers/sms/orange.js";

const config = {
  basicAuth: "Basic abc",
  senderAddress: "tel:+2250000",
  senderName: "AMANEPLUS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createOrangeSmsTransport", () => {
  it("obtient un token puis envoie le SMS au format Orange", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "token-1", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          outboundSMSMessageRequest: {
            resourceReference: {
              resourceURL: "https://api.orange.com/sms/123",
            },
          },
        }, 201),
      );
    const transport = createOrangeSmsTransport(config, fetchImpl);

    const result = await transport.send({
      to: "2250712345678",
      text: "  Bonjour Ada  ",
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "https://api.orange.com/oauth/v3/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic abc",
        },
        body: "grant_type=client_credentials",
      },
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://api.orange.com/smsmessaging/v1/outbound/tel:+2250000/requests",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-1",
        },
        body: JSON.stringify({
          outboundSMSMessageRequest: {
            address: ["tel:+2250712345678"],
            senderAddress: "tel:+2250000",
            senderName: "AMANEPLUS",
            outboundSMSTextMessage: { message: "Bonjour Ada" },
          },
        }),
      },
    );
    expect(result).toEqual({
      messageId: "https://api.orange.com/sms/123",
    });
  });

  it("réutilise le token tant qu'il n'est pas expiré", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.endsWith("/token")) {
        return jsonResponse({ access_token: "token-1", expires_in: 3600 });
      }
      return jsonResponse({});
    });
    const transport = createOrangeSmsTransport(config, fetchImpl);

    await transport.send({ to: "+2250712345678", text: "Un" });
    await transport.send({ to: "+2250712345678", text: "Deux" });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://api.orange.com/oauth/v3/token",
    );
  });

  it("n'appelle pas Orange pour un message vide ou trop long", async () => {
    const fetchImpl = vi.fn();
    const transport = createOrangeSmsTransport(config, fetchImpl);

    await expect(
      transport.send({ to: "+2250712345678", text: "   " }),
    ).rejects.toThrow("Message cannot be empty");
    await expect(
      transport.send({ to: "+2250712345678", text: "a".repeat(161) }),
    ).rejects.toThrow("Message too long. Maximum 160 characters allowed");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("remonte l'erreur renvoyée par Orange", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "token-1" }))
      .mockResolvedValueOnce(
        jsonResponse({ code: "42", message: "sender rejected" }, 400),
      );
    const transport = createOrangeSmsTransport(config, fetchImpl);

    await expect(
      transport.send({ to: "+2250712345678", text: "Bonjour" }),
    ).rejects.toThrow("Orange SMS request failed (400): 42: sender rejected");
  });
});
