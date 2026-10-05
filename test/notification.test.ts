import { describe, expect, it, vi } from "vitest";
import type { NotificationProvider } from "../src/types.js";
import { Notification } from "../src/notification.js";

function provider(send: NotificationProvider["send"]): NotificationProvider {
  return { send };
}

describe("Notification", () => {
  it("distribue la demande sur chaque canal configuré", async () => {
    const emailSend = vi.fn(async () => ({ messageId: "email-1" }));
    const smsSend = vi.fn(async () => ({ messageId: "sms-1" }));
    const notification = new Notification({
      providers: {
        email: provider(emailSend),
        sms: provider(smsSend),
      },
    });
    const recipient = {
      id: "user-1",
      email: "ada@example.com",
      phone: "+33123456789",
    };
    const data = { amount: 2500, currency: "USD", paymentId: "pay_123" };

    const results = await notification.send({
      topic: "payment.success",
      recipient,
      channels: ["email", "sms"],
      data,
    });

    expect(results).toEqual([
      { channel: "email", success: true, messageId: "email-1" },
      { channel: "sms", success: true, messageId: "sms-1" },
    ]);
    expect(emailSend).toHaveBeenCalledWith("payment.success", recipient, data);
    expect(smsSend).toHaveBeenCalledWith("payment.success", recipient, data);
  });

  it("signale un canal sans fournisseur sans interrompre les autres", async () => {
    const emailSend = vi.fn(async () => ({ messageId: "email-1" }));
    const notification = new Notification({
      providers: {
        email: provider(emailSend),
      },
    });

    const results = await notification.send({
      topic: "payment.success",
      recipient: { email: "ada@example.com", phone: "+33123456789" },
      channels: ["email", "sms"],
    });

    expect(results[0]).toEqual({
      channel: "email",
      success: true,
      messageId: "email-1",
    });
    expect(results[1]).toMatchObject({
      channel: "sms",
      success: false,
    });
    expect(results[1]?.error).toBeInstanceOf(Error);
    expect(results[1]?.error?.message).toBe(
      "No provider configured for channel: sms",
    );
  });

  it("capture l'échec d'un fournisseur et conserve le succès des autres canaux", async () => {
    const notification = new Notification({
      providers: {
        email: provider(async () => {
          throw new Error("smtp down");
        }),
        sms: provider(async () => ({ messageId: "sms-1" })),
      },
    });

    const results = await notification.send({
      topic: "payment.success",
      recipient: { email: "ada@example.com", phone: "+33123456789" },
      channels: ["email", "sms"],
    });

    expect(results).toEqual([
      {
        channel: "email",
        success: false,
        error: expect.any(Error),
      },
      { channel: "sms", success: true, messageId: "sms-1" },
    ]);
    expect(results[0]?.error?.message).toBe("smtp down");
  });

  it("enveloppe une erreur non-Error dans une instance d'Error", async () => {
    const notification = new Notification({
      providers: {
        email: provider(async () => {
          throw "boom";
        }),
      },
    });

    const results = await notification.send({
      topic: "payment.success",
      recipient: { email: "ada@example.com" },
      channels: ["email"],
    });

    expect(results[0]?.success).toBe(false);
    expect(results[0]?.error).toBeInstanceOf(Error);
    expect(results[0]?.error?.message).toBe("boom");
  });
});
