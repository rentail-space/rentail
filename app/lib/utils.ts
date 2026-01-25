/**
 * Pluralize a word based on the count. For example, "1 review" or "2 reviews".
 *
 * @param count - The count of the word.
 * @param singular - The singular form of the word.
 * @param plural - The plural form of the word.
 * @returns The pluralized word.
 */
export function pluralize(count: number, singular: string, plural: string) {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

/**
 * Slugify a text(s). For example, slugify("CA", "Los Angeles") returns
 * "ca-los-angeles".
 *
 * @param texts - The text(s) to slugify.
 * @returns The slugified text.
 */
export function slugify(...texts: string[]) {
  return texts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
