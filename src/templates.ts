import type { EmailTemplate } from "./types.js";

export function renderTemplate(
  template: string,
  data: Record<string, unknown> = {},
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = data[key];
    if (value === undefined || value === null) {
      return "";
    }
    return String(value);
  });
}

export class TemplateRegistry {
  private readonly templates = new Map<string, EmailTemplate>();

  register(topic: string, template: EmailTemplate): void {
    this.templates.set(topic, template);
  }

  get(topic: string): EmailTemplate | undefined {
    return this.templates.get(topic);
  }
}

export const templates = new TemplateRegistry();

export function registerTemplate(topic: string, template: EmailTemplate): void {
  templates.register(topic, template);
}
