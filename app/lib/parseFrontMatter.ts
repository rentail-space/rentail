import { invariant } from "es-toolkit";
import YAML from "yaml";

export default function parseFrontMatter<T = Record<string, unknown>>(
  document: string,
): {
  body: string;
  attributes: T;
} {
  const [, frontMatter, ...body] = document.split(/^---$/m);
  invariant(frontMatter, "Front matter not found");
  const attributes = YAML.parse(frontMatter);
  return { body: body.join("\n---\n"), attributes };
}
