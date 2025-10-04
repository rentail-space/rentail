import { readFile } from "node:fs/promises";
import path from "node:path";
import { invariant } from "es-toolkit";
import type { LoaderFunctionArgs, Params } from "react-router";

export async function loader({ params }: LoaderFunctionArgs<{ post: string }>) {
  try {
    const postName = validateParam(params);
    const image = await readFile(
      path.join(process.cwd(), "app/data/blog", `${postName}.jpg`),
    );
    return new Response(image.buffer as BodyInit, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error(error);
    throw new Response("Not Found", { status: 404 });
  }
}

export function validateParam(params: Params<string>) {
  const postName = params.post;

  // This prevents attacks like:
  // - ../../../etc/passwd
  // - ..\\..\\windows\\system32\\config
  // - .git/config
  invariant(
    postName &&
      path.basename(postName) === postName && // No path separators
      /^[a-zA-Z0-9-]+$/.test(postName), // Only safe characters
    "Invalid post name",
  );
  return postName;
}
