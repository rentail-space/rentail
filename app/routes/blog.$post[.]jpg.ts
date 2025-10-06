import { readFile } from "node:fs/promises";
import type { LoaderFunctionArgs } from "react-router";
import { loadBlogPost } from "~/lib/blogPosts.server";

export async function loader({ params }: LoaderFunctionArgs<{ post: string }>) {
  try {
    const { filename } = await loadBlogPost(params.post);
    const image = await readFile(filename.replace(".md", ".jpg"));
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
