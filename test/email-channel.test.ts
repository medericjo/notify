import { describe, expect, it, vi } from "vitest";
import { EmailChannel } from "../src/providers/email/channel.js";
import { TemplateRegistry } from "../src/templates.js";
import type { EmailTransport } from "../src/providers/email/transport.js";

function registryWithTestTemplate() {
  const registry = new TemplateRegistry();
  registry.register("topic.test", {
    subject: "Test {{name}}",
    text: "Bonjour {{name}}",
    html: "<p>{{name}}</p>",
  });
  return registry;
}

describe("EmailChannel", () => {
  it("rend le template du type et l'envoie au transport", async () => {
    const transport: EmailTransport = {
      send: vi.fn(async () => ({ messageId: "email-1" })),
    };
    const channel = new EmailChannel(() => transport, registryWithTestTemplate());

    const result = await channel.send(
      "topic.test",
      { email: "ada@example.com", name: "Ada" },
    );

    expect(transport.send).toHaveBeenCalledWith({
      to: "ada@example.com",
      subject: "Test Ada",
      text: "Bonjour Ada",
      html: "<p>Ada</p>",
    });
    expect(result).toEqual({ messageId: "email-1" });
  });

  it("laisse les données écraser les champs du destinataire", async () => {
    const transport: EmailTransport = {
      send: vi.fn(async () => ({ messageId: "email-1" })),
    };
    const registry = new TemplateRegistry();
    registry.register("topic.test", {
      subject: "{{name}}",
      text: "{{name}}",
    });
    const channel = new EmailChannel(() => transport, registry);

    await channel.send(
      "topic.test",
      { email: "ada@example.com", name: "Ada" },
      { name: "Grace" },
    );

    expect(transport.send).toHaveBeenCalledWith({
      to: "ada@example.com",
      subject: "Grace",
      text: "Grace",
    });
  });

  it("refuse un destinataire sans email", async () => {
    const transport: EmailTransport = { send: vi.fn() };
    const channel = new EmailChannel(() => transport, registryWithTestTemplate());

    await expect(
      channel.send("topic.test", { phone: "+33123456789" }),
    ).rejects.toThrow("Recipient does not have an email address");
    expect(transport.send).not.toHaveBeenCalled();
  });

  it("refuse un type sans template", async () => {
    const transport: EmailTransport = { send: vi.fn() };
    const channel = new EmailChannel(() => transport, new TemplateRegistry());

    await expect(
      channel.send("topic.test", { email: "ada@example.com" }),
    ).rejects.toThrow("No template registered for topic: topic.test");
    expect(transport.send).not.toHaveBeenCalled();
  });
});
