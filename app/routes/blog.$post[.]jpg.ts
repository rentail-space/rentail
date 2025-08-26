import { readFile } from "node:fs/promises";
import path from "node:path";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ params }: LoaderFunctionArgs<{ post: string }>) {
  try {
    const image = await readFile(
      path.join(process.cwd(), "app/data/blog", `${params.post}.jpg`),
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
