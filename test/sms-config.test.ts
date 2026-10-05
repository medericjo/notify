import { describe, expect, it } from "vitest";
import { readSmsConfig } from "../src/providers/sms/config.js";

describe("readSmsConfig", () => {
  it("lit Orange SMS avec les valeurs fournies", () => {
    expect(
      readSmsConfig({
        SMS_PROVIDER: "orange",
        ORANGE_SMS_BASIC_AUTH: "Basic abc",
        ORANGE_SMS_SENDER_ADDRESS: "tel:+2250001",
        ORANGE_SMS_SENDER_NAME: "BRICKS",
      }),
    ).toEqual({
      provider: "orange",
      orange: {
        basicAuth: "Basic abc",
        senderAddress: "tel:+2250001",
        senderName: "BRICKS",
      },
    });
  });

  it("applique l'expéditeur Orange par défaut", () => {
    expect(
      readSmsConfig({
        SMS_PROVIDER: "orange",
        ORANGE_SMS_BASIC_AUTH: "Basic abc",
      }),
    ).toEqual({
      provider: "orange",
      orange: {
        basicAuth: "Basic abc",
        senderAddress: "tel:+2250000",
        senderName: "AMANEPLUS",
      },
    });
  });

  it("signale l'absence de SMS_PROVIDER", () => {
    expect(() => readSmsConfig({})).toThrow(
      "Missing environment variable: SMS_PROVIDER",
    );
  });

  it("signale l'absence des identifiants Orange", () => {
    expect(() => readSmsConfig({ SMS_PROVIDER: "orange" })).toThrow(
      "Missing environment variable: ORANGE_SMS_BASIC_AUTH",
    );
  });

  it("lit LeTexto", () => {
    expect(
      readSmsConfig({
        SMS_PROVIDER: "letexto",
        LETEXTO_API_TOKEN: "token-1",
        LETEXTO_SENDER: "SMS INFO",
        LETEXTO_DLR_URL: "https://example.com/dlr",
        LETEXTO_DLR_METHOD: "POST",
      }),
    ).toEqual({
      provider: "letexto",
      letexto: {
        token: "token-1",
        sender: "SMS INFO",
        dlrUrl: "https://example.com/dlr",
        dlrMethod: "POST",
      },
    });
  });

  it("signale l'absence du token LeTexto", () => {
    expect(() =>
      readSmsConfig({
        SMS_PROVIDER: "letexto",
        LETEXTO_SENDER: "SMS INFO",
      }),
    ).toThrow("Missing environment variable: LETEXTO_API_TOKEN");
  });

  it("signale un provider inconnu", () => {
    expect(() => readSmsConfig({ SMS_PROVIDER: "twilio" })).toThrow(
      "Unknown sms provider: twilio",
    );
  });
});
