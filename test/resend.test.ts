import { describe, expect, it, vi } from "vitest";
import { createResendTransport } from "../src/providers/email/resend.js";

describe("createResendTransport", () => {
  it("envoie le message via Resend et renvoie l'identifiant", async () => {
    const send = vi.fn(async () => ({ data: { id: "re_1" }, error: null }));
    const transport = createResendTransport(
      { apiKey: "re_test", from: "notifications@example.com" },
      { emails: { send } },
    );

    const result = await transport.send({
      to: "ada@example.com",
      subject: "Test Ada",
      text: "Bonjour Ada",
    });

    expect(send).toHaveBeenCalledWith({
      from: "notifications@example.com",
      to: "ada@example.com",
      subject: "Test Ada",
      text: "Bonjour Ada",
    });
    expect(result).toEqual({ messageId: "re_1" });
  });

  it("échoue quand Resend renvoie une erreur", async () => {
    const send = vi.fn(async () => ({
      data: null,
      error: { message: "invalid from" },
    }));
    const transport = createResendTransport(
      { apiKey: "re_test", from: "notifications@example.com" },
      { emails: { send } },
    );

    await expect(
      transport.send({
        to: "ada@example.com",
        subject: "Test",
        text: "Bonjour",
      }),
    ).rejects.toThrow("invalid from");
  });
});
