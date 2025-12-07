/**
 * Detects the device based on the user agent string.
 *
 * @param userAgent - The user agent string to detect the device from.
 * @returns The device string, e.g. "Windows (Desktop)", "Android (Mobile)",
 * "iOS (Mobile)", "macOS (Desktop)", "Blackberry (Mobile)", "Linux (Desktop)",
 * "Chrome", "Firefox", "Safari", "Other (Desktop)".
 */
export default function deviceDetection(userAgent?: string | null): string {
  const suffix =
    userAgent &&
    /mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent)
      ? "(Mobile)"
      : "(Desktop)";

  if (!userAgent) return `Unknown ${suffix}`;
  if (/windows/i.test(userAgent)) return `Windows ${suffix}`;
  if (/android/i.test(userAgent)) return `Android ${suffix}`;
  if (/iphone|ipad|ipod/i.test(userAgent)) return `iOS ${suffix}`;
  if (/macintosh|mac os x/i.test(userAgent)) return `macOS ${suffix}`;
  if (/blackberry|windows phone/i.test(userAgent))
    return `Blackberry ${suffix}`;
  if (/linux/i.test(userAgent)) return `Linux ${suffix}`;
  if (/chrome/i.test(userAgent)) return "Chrome";
  if (/firefox/i.test(userAgent)) return `Firefox ${suffix}`;
  if (/safari/i.test(userAgent)) return `Safari ${suffix}`;
  return `Other ${suffix}`;
}
