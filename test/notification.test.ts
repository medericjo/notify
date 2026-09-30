import { describe, expect, it, vi } from "vitest";
import { EmailProvider } from "../src/providers/email.js";
import { SmsProvider } from "../src/providers/sms.js";
import { Notification } from "../src/notification.js";

describe("EmailProvider", () => {
  it("envoie l'adresse email, le sujet et les données au transport", async () => {
    const send = vi.fn(async () => ({ messageId: "email-1" }));
    const provider = new EmailProvider({ send });

    const result = await provider.send(
      "payment.success",
      { email: "ada@example.com", name: "Ada" },
      { amount: 2500 },
    );

    expect(send).toHaveBeenCalledWith({
      to: "ada@example.com",
      topic: "payment.success",
      data: { amount: 2500 },
    });
    expect(result).toEqual({ messageId: "email-1" });
  });

  it("refuse un destinataire sans adresse email", async () => {
    const send = vi.fn();
    const provider = new EmailProvider({ send });

    await expect(
      provider.send("payment.success", { phone: "+33123456789" }),
    ).rejects.toThrow("Recipient does not have an email address");
    expect(send).not.toHaveBeenCalled();
  });
});

describe("SmsProvider", () => {
  it("envoie le numéro, le sujet et les données au transport", async () => {
    const send = vi.fn(async () => ({ messageId: "sms-1" }));
    const provider = new SmsProvider({ send });

    const result = await provider.send(
      "payment.success",
      { phone: "+33123456789" },
      { amount: 2500 },
    );

    expect(send).toHaveBeenCalledWith({
      to: "+33123456789",
      topic: "payment.success",
      data: { amount: 2500 },
    });
    expect(result).toEqual({ messageId: "sms-1" });
  });

  it("refuse un destinataire sans numéro de téléphone", async () => {
    const send = vi.fn();
    const provider = new SmsProvider({ send });

    await expect(
      provider.send("payment.success", { email: "ada@example.com" }),
    ).rejects.toThrow("Recipient does not have a phone number");
    expect(send).not.toHaveBeenCalled();
  });
});

describe("Notification", () => {
  it("distribue la demande sur chaque canal configuré", async () => {
    const emailSend = vi.fn(async () => ({ messageId: "email-1" }));
    const smsSend = vi.fn(async () => ({ messageId: "sms-1" }));
    const notification = new Notification({
      providers: {
        email: new EmailProvider({ send: emailSend }),
        sms: new SmsProvider({ send: smsSend }),
      },
    });

    const results = await notification.send({
      topic: "payment.success",
      recipient: {
        id: "user-1",
        email: "ada@example.com",
        phone: "+33123456789",
      },
      channels: ["email", "sms"],
      data: { amount: 2500, currency: "USD", paymentId: "pay_123" },
    });

    expect(results).toEqual([
      { channel: "email", success: true, messageId: "email-1" },
      { channel: "sms", success: true, messageId: "sms-1" },
    ]);
    expect(emailSend).toHaveBeenCalledWith({
      to: "ada@example.com",
      topic: "payment.success",
      data: { amount: 2500, currency: "USD", paymentId: "pay_123" },
    });
    expect(smsSend).toHaveBeenCalledWith({
      to: "+33123456789",
      topic: "payment.success",
      data: { amount: 2500, currency: "USD", paymentId: "pay_123" },
    });
  });

  it("signale un canal sans fournisseur sans interrompre les autres", async () => {
    const emailSend = vi.fn(async () => ({ messageId: "email-1" }));
    const notification = new Notification({
      providers: {
        email: new EmailProvider({ send: emailSend }),
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
        email: new EmailProvider({
          send: async () => {
            throw new Error("smtp down");
          },
        }),
        sms: new SmsProvider({
          send: async () => ({ messageId: "sms-1" }),
        }),
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
        email: new EmailProvider({
          send: async () => {
            throw "boom";
          },
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
