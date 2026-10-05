const IVORY_COAST_PHONE = /^(\+?225)(\d{10})$/;

export function normalizeIvoryCoastPhone(phoneNumber: string): string {
  const cleanNumber = phoneNumber.replace(/\s+/g, "");
  if (!IVORY_COAST_PHONE.test(cleanNumber)) {
    throw new Error(
      "Invalid phone number format. Expected format: +225XXXXXXXXXX (10 digits after 225)",
    );
  }

  return cleanNumber.startsWith("+") ? cleanNumber : `+${cleanNumber}`;
}
