import { readdir, readFile } from "node:fs/promises";
import path, { basename, join } from "node:path";
import dayjs from "dayjs";
import { invariant } from "es-toolkit";
import { DateTime } from "luxon";

/**
 * Lists all blog posts in the blogPostsDir directory. We only include posts that
 * are published based on the published date in the filename.
 *
 * @returns An array of blog post filenames.
 */
export async function listBlogPosts(): Promise<string[]> {
  const blogPostsDir = path.join(__dirname, "../data/blog");
  const filenames = await readdir(blogPostsDir);
  const publishedPosts = filenames
    .filter((filename) => filename.endsWith(".md"))
    .filter((filename) => {
      const published = getPublishedData(filename);
      return dayjs().isAfter(published.toJSDate());
    });
  return publishedPosts.map((filename) => join(blogPostsDir, filename));
}

/**
 * Gets the published date from the filename. We use the filename to get the
 * published date because the published date is stored in the filename.
 *
 * @param filename The filename of the blog post.
 * @returns The published date.
 */
function getPublishedData(filename: string): DateTime {
  const published = DateTime.fromISO(
    basename(filename).match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
    { zone: "utc" },
  );
  return published;
}

/**
 * Loads a blog post by slug. Throws an error if:
 * - the blog post is not found
 * - the slug is not provided
 * - the published date is in the future
 * - the slug is not a valid slug
 *
 * @param slug The slug of the blog post.
 * @returns The blog post, published date, slug, and filename.
 */
export async function loadBlogPost(slug?: string): Promise<{
  post: string;
  published: Date;
  slug: string;
  filename: string;
}> {
  invariant(slug, "Slug is required");
  const blogPosts = await listBlogPosts();
  const filename = blogPosts.find((filename) =>
    filename.endsWith(`${slug}.md`),
  );
  invariant(filename, "Blog post not found");
  const post = await readFile(filename, "utf8");
  const published = getPublishedData(filename).toJSDate();
  invariant(dayjs().isAfter(published), "Published date is in the future");
  return { post, slug, published, filename };
}
