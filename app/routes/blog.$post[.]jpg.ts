import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ params }: LoaderFunctionArgs<{ post: string }>) {
  try {
    const { buffer } = await readFile(
      resolve("./app/data/blog", `${params.post}.jpg`),
    );
    return new Response(buffer as BodyInit, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "image/jpeg",
      },
    });
  } catch (error) {
    console.error(error);
    throw new Response("Not Found", { status: 404 });
  }
}
