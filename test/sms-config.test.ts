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

  it("signale un provider inconnu", () => {
    expect(() => readSmsConfig({ SMS_PROVIDER: "twilio" })).toThrow(
      "Unknown sms provider: twilio",
    );
  });
});
