import { afterEach, describe, expect, it, vi } from "vitest";
import { createNotification } from "../src/notification.js";
import { TemplateRegistry } from "../src/templates.js";

const orangeEnv = {
  SMS_PROVIDER: "orange",
  ORANGE_SMS_BASIC_AUTH: "Basic abc",
  ORANGE_SMS_SENDER_NAME: "BRICKS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("createNotification SMS", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envoie un SMS Orange à partir du topic, sans transport fourni par l'appelant", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "token-1" }))
      .mockResolvedValueOnce(
        jsonResponse({
          outboundSMSMessageRequest: {
            resourceReference: { resourceURL: "https://api.orange.com/sms/9" },
          },
        }, 201),
      );
    vi.stubGlobal("fetch", fetchImpl);
    const registry = new TemplateRegistry();
    registry.register("topic.test", {
      subject: "Email",
      text: "Email",
      sms: "Bonjour {{name}}",
    });

    const results = await createNotification(orangeEnv, registry).send({
      topic: "topic.test",
      recipient: { phone: "+2250712345678", name: "Ada" },
      channels: ["sms"],
    });

    expect(results).toEqual([
      {
        channel: "sms",
        success: true,
        messageId: "https://api.orange.com/sms/9",
      },
    ]);
    const smsCall = fetchImpl.mock.calls[1];
    expect(smsCall?.[0]).toBe(
      "https://api.orange.com/smsmessaging/v1/outbound/tel:+2250000/requests",
    );
    expect(JSON.parse(String(smsCall?.[1]?.body))).toMatchObject({
      outboundSMSMessageRequest: {
        address: ["tel:+2250712345678"],
        senderName: "BRICKS",
        outboundSMSTextMessage: { message: "Bonjour Ada" },
      },
    });
  });
});
