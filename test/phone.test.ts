import { describe, expect, it } from "vitest";
import {
  normalizeInternationalPhone,
  normalizeIvoryCoastPhone,
} from "../src/providers/sms/phone.js";

describe("normalizeIvoryCoastPhone", () => {
  it("conserve un numéro déjà préfixé", () => {
    expect(normalizeIvoryCoastPhone("+225 07 12 34 56 78")).toBe(
      "+2250712345678",
    );
  });

  it("ajoute le + quand l'indicatif est présent sans lui", () => {
    expect(normalizeIvoryCoastPhone("2250712345678")).toBe("+2250712345678");
  });

  it("refuse un numéro qui n'est pas ivoirien à 10 chiffres", () => {
    expect(() => normalizeIvoryCoastPhone("+33612345678")).toThrow(
      "Invalid phone number format. Expected format: +225XXXXXXXXXX (10 digits after 225)",
    );
  });
});

describe("normalizeInternationalPhone", () => {
  it("accepte les numéros d'autres pays africains", () => {
    expect(normalizeInternationalPhone("+221 77 123 45 67")).toBe(
      "221771234567",
    );
    expect(normalizeInternationalPhone("22670123456")).toBe("22670123456");
    expect(normalizeInternationalPhone("+223 65 12 34 56")).toBe("22365123456");
  });

  it("refuse une chaîne qui n'est pas un numéro international", () => {
    expect(() => normalizeInternationalPhone("12")).toThrow(
      "Invalid phone number format. Expected an international number",
    );
  });
});
