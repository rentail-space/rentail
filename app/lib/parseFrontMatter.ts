import { invariant } from "es-toolkit";
import YAML from "yaml";

export default function parseFrontMatter<T = Record<string, unknown>>(
  document: string,
): {
  body: string;
  attributes: T;
} {
  // Use regexp to match anything between first and second ---
  // (Note: split above is unreliable if --- appears in content)
  const match = document.match(/^---\n([\s\S]*?)\n---\n?/m);
  invariant(match, "Front matter not found");
  const frontMatter = match[1];
  const body = document.slice(match[0].length);
  invariant(frontMatter, "Front matter not found");
  const attributes = YAML.parse(frontMatter);
  return { body, attributes };
}
