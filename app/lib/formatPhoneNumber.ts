/**
 * Formats an E.164 phone number as a US number with area code.
 * Example: "+13105420900" -> "(310) 542-0900"
 */
export default function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D+/g, "");
  // E.164 US numbers should be 11 digits starting with 1
  // e.g. +1 310 542 0900 -> "13105420900"
  let normalized = digits;
  if (digits.length === 11 && digits.startsWith("1")) {
    normalized = digits.slice(1);
  }
  if (normalized.length !== 10) {
    // Return as-is if not a standard 10-digit US number
    return phone;
  }
  const areaCode = normalized.slice(0, 3);
  const prefix = normalized.slice(3, 6);
  const lineNumber = normalized.slice(6, 10);
  return `(${areaCode}) ${prefix}-${lineNumber}`;
}
