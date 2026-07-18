/**
 * Marker that introduces a phone extension, e.g. the "ext. 400" in
 * "+1 714-687-0000 ext. 400". Matched case-insensitively, optionally
 * followed by a dot, then the extension digits. Anything from the marker
 * to the end of the string is dropped before digit extraction, so extension
 * digits are never merged into the base number.
 */
const extensionPattern = /\s*(?:extension|ext|ex|x)\.?\s*\d.*$/i;

/**
 * Normalize an international phone number to E.164-ish `+<digits>` form.
 *
 * Google Places returns `internationalPhoneNumber` as a human-readable string
 * like "+1 310-854-0070". We drop any trailing extension ("ext. 400",
 * "x400", etc.), strip every remaining non-digit character, and prepend a
 * single "+", yielding "+13108540070".
 *
 * Background: this was previously inlined in the Google Places scraper as
 * `replace(/D/g, "")` — a regex matching the literal letter "D" instead of
 * `\D` (non-digits). That stored every phone as "++1 310-854-0070", which
 * the chat agent read as garbage and reported as "not available". This helper
 * is extracted so the normalization is unit-testable in isolation. Extension
 * stripping was added after an "ext. 400" produced a bogus 15-digit number.
 *
 * @param internationalPhoneNumber - The raw phone string (e.g. from Google
 * Places `internationalPhoneNumber`), or `undefined`/empty when missing.
 * @returns The normalized `+<digits>` string, or `undefined` when the input is
 * missing or contains no digits after the extension is removed.
 */
export default function normalizePhone(
  internationalPhoneNumber?: string,
): string | undefined {
  if (!internationalPhoneNumber) return undefined;
  const withoutExtension = internationalPhoneNumber.replace(
    extensionPattern,
    "",
  );
  const digits = withoutExtension.replace(/\D/g, "");
  return digits ? `+${digits}` : undefined;
}
