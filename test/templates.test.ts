import { describe, expect, it } from "vitest";
import { renderTemplate } from "../src/templates.js";

describe("renderTemplate", () => {
  it("remplace les variables du contexte", () => {
    expect(
      renderTemplate("Bonjour {{ name }}, montant {{amount}}", {
        name: "Ada",
        amount: 2500,
      }),
    ).toBe("Bonjour Ada, montant 2500");
  });

  it("laisse vide une variable absente", () => {
    expect(renderTemplate("Bonjour {{name}}", {})).toBe("Bonjour ");
  });
});
