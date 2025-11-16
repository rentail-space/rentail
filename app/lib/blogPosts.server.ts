import dayjs from "dayjs";
import { invariant } from "es-toolkit";
import { DateTime } from "luxon";
import { readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path, { basename, join } from "node:path";
import removeMd from "remove-markdown";
import parseFrontMatter from "~/lib/parseFrontMatter";
import truncateWords from "~/lib/truncateWords";

const dirname = path.resolve("./app/data/blog");

export type BlogPost = {
  alt?: string;
  body: string;
  image?: string;
  published: Date;
  slug: string;
  summary: string;
  title: string;
};

/**
 * Lists all blog posts that are published based on the published date in the
 * filename.
 *
 * @returns An array of blog posts.
 */
export async function recentBlogPosts(): Promise<BlogPost[]> {
  const filenames = await readdir(dirname);
  return filenames
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => {
      const published = getPublishedData(filename).toJSDate();
      const content = readFileSync(join(dirname, filename), "utf8");
      const { attributes, body } = parseFrontMatter<{
        alt: string;
        image: string;
        summary: string;
        title: string;
      }>(content);
      const slug = basename(filename, ".md");
      return {
        ...attributes,
        body,
        published,
        slug,
      };
    })
    .filter(({ published }) => dayjs().isAfter(published))
    .sort((a, b) => b.published.getTime() - a.published.getTime());
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
 * @returns The blog post, published date, slug, filename, alt text, and title.
 */
export async function loadBlogPost(slug?: string): Promise<BlogPost> {
  invariant(slug, "Slug is required");
  const filename = join(dirname, `${slug}.md`);
  const post = await readFile(filename, "utf8");
  const published = getPublishedData(filename).toJSDate();
  const { attributes, body } = parseFrontMatter<{
    title: string;
    alt?: string;
    image?: string;
    summary?: string;
  }>(post);
  return {
    ...attributes,
    body,
    published,
    slug,
    summary: attributes.summary || truncateWords(removeMd(body), 20),
  };
}
