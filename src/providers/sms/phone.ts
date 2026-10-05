const IVORY_COAST_PHONE = /^(\+?225)(\d{10})$/;
const INTERNATIONAL_PHONE = /^[1-9]\d{7,14}$/;

export function normalizeIvoryCoastPhone(phoneNumber: string): string {
  const cleanNumber = phoneNumber.replace(/\s+/g, "");
  if (!IVORY_COAST_PHONE.test(cleanNumber)) {
    throw new Error(
      "Invalid phone number format. Expected format: +225XXXXXXXXXX (10 digits after 225)",
    );
  }

  return cleanNumber.startsWith("+") ? cleanNumber : `+${cleanNumber}`;
}

export function normalizeInternationalPhone(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\s+/g, "").replace(/^\+/, "");
  if (!INTERNATIONAL_PHONE.test(digits)) {
    throw new Error(
      "Invalid phone number format. Expected an international number",
    );
  }

  return digits;
}
