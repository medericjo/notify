import { describe, expect, it, vi } from "vitest";
import { SmsChannel } from "../src/providers/sms/channel.js";
import type { SmsTransport } from "../src/providers/sms/transport.js";
import { TemplateRegistry } from "../src/templates.js";

function registry() {
  const templates = new TemplateRegistry();
  templates.register("topic.test", {
    subject: "Email",
    text: "Email {{name}}",
    sms: "Code {{name}}",
  });
  return templates;
}

describe("SmsChannel", () => {
  it("rend le texte SMS du topic et l'envoie au transport", async () => {
    const transport: SmsTransport = {
      send: vi.fn(async () => ({ messageId: "sms-1" })),
    };
    const channel = new SmsChannel(() => transport, registry());

    const result = await channel.send("topic.test", {
      phone: "+2250712345678",
      name: "Ada",
    });

    expect(transport.send).toHaveBeenCalledWith({
      to: "+2250712345678",
      text: "Code Ada",
    });
    expect(result).toEqual({ messageId: "sms-1" });
  });

  it("utilise le texte email quand aucun texte SMS n'est défini", async () => {
    const transport: SmsTransport = {
      send: vi.fn(async () => ({ messageId: "sms-1" })),
    };
    const templates = new TemplateRegistry();
    templates.register("topic.test", {
      subject: "Email",
      text: "Bonjour {{name}}",
    });
    const channel = new SmsChannel(() => transport, templates);

    await channel.send("topic.test", {
      phone: "+2250712345678",
      name: "Ada",
    });

    expect(transport.send).toHaveBeenCalledWith({
      to: "+2250712345678",
      text: "Bonjour Ada",
    });
  });

  it("refuse un destinataire sans téléphone", async () => {
    const transport: SmsTransport = { send: vi.fn() };
    const channel = new SmsChannel(() => transport, registry());

    await expect(
      channel.send("topic.test", { email: "ada@example.com" }),
    ).rejects.toThrow("Recipient does not have a phone number");
    expect(transport.send).not.toHaveBeenCalled();
  });

  it("refuse un topic sans template", async () => {
    const transport: SmsTransport = { send: vi.fn() };
    const channel = new SmsChannel(() => transport, new TemplateRegistry());

    await expect(
      channel.send("topic.test", { phone: "+2250712345678" }),
    ).rejects.toThrow("No template registered for topic: topic.test");
    expect(transport.send).not.toHaveBeenCalled();
  });
});
