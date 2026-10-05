import { afterEach, describe, expect, it, vi } from "vitest";
import { createNotification } from "../src/notification.js";
import { createLeTextoTransport } from "../src/providers/sms/letexto.js";
import { TemplateRegistry } from "../src/templates.js";

const config = {
  token: "token-1",
  sender: "SMS INFO",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("createLeTextoTransport", () => {
  it("envoie le SMS et renvoie l'identifiant du message", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ id: "msg-1" }));
    const transport = createLeTextoTransport(config, fetchImpl);

    const result = await transport.send({
      to: "+225 07 12 34 56 78",
      text: "  Bonjour Ada  ",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://apis.letexto.com/v1/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer token-1",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SMS INFO",
          to: "2250712345678",
          content: "Bonjour Ada",
        }),
      },
    );
    expect(result).toEqual({ messageId: "msg-1" });
  });

  it("envoie un numéro hors Côte d'Ivoire", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) =>
      jsonResponse({ id: "msg-sn" }),
    );
    const transport = createLeTextoTransport(config, fetchImpl);

    await transport.send({ to: "+221 77 123 45 67", text: "Bonjour" });

    expect(JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body))).toMatchObject({
      to: "221771234567",
    });
  });

  it("ajoute l'adresse de statut quand elle est configurée", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) =>
      jsonResponse({ id: "msg-2" }),
    );
    const transport = createLeTextoTransport(
      {
        ...config,
        dlrUrl: "https://example.com/dlr",
        dlrMethod: "POST",
      },
      fetchImpl,
    );

    await transport.send({ to: "2250712345678", text: "Bonjour" });

    expect(JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body))).toMatchObject({
      dlrUrl: "https://example.com/dlr",
      dlrMethod: "POST",
    });
  });

  it("n'appelle pas LeTexto pour un message vide", async () => {
    const fetchImpl = vi.fn();
    const transport = createLeTextoTransport(config, fetchImpl);

    await expect(
      transport.send({ to: "+2250712345678", text: "   " }),
    ).rejects.toThrow("Message cannot be empty");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("remonte l'erreur renvoyée par LeTexto", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ message: "invalid sender" }, 400),
    );
    const transport = createLeTextoTransport(config, fetchImpl);

    await expect(
      transport.send({ to: "+2250712345678", text: "Bonjour" }),
    ).rejects.toThrow("LeTexto request failed (400): invalid sender");
  });
});

describe("createNotification LeTexto", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sélectionne LeTexto quand SMS_PROVIDER vaut letexto", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ id: "msg-9" }));
    vi.stubGlobal("fetch", fetchImpl);
    const registry = new TemplateRegistry();
    registry.register("topic.test", {
      subject: "Email",
      text: "Email",
      sms: "Bonjour {{name}}",
    });

    const results = await createNotification(
      {
        SMS_PROVIDER: "letexto",
        LETEXTO_API_TOKEN: "token-1",
        LETEXTO_SENDER: "SMS INFO",
      },
      registry,
    ).send({
      topic: "topic.test",
      recipient: { phone: "+2250712345678", name: "Ada" },
      channels: ["sms"],
    });

    expect(results).toEqual([
      { channel: "sms", success: true, messageId: "msg-9" },
    ]);
  });
});
