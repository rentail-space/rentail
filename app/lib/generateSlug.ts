export function generateSlug(name: string, state: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Trim hyphens

  return `${state.toLowerCase()}-${normalized}`;
}
