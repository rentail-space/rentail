import { invariant } from "es-toolkit";
import { DateTime } from "luxon";
import { readFileSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path, { basename, join } from "node:path";
import removeMd from "remove-markdown";
import parseFrontMatter from "~/lib/parseFrontMatter";
import truncateWords from "~/lib/truncateWords";
import { slugify } from "./utils";

const dirname = path.resolve("./app/data/news");

export type NewsItem = {
  body: string;
  published: string; // YYYY-MM-DD
  slug: string;
  summary: string;
  title: string;
};

/**
 * Lists all news items that are published based on the published date in the
 * filename.
 *
 * @returns An array of news items.
 */
export async function recentNewsItems(): Promise<NewsItem[]> {
  const filenames = readdirSync(dirname);
  const morning = DateTime.local({ zone: "America/Los_Angeles" }).toISO();
  return filenames
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => {
      const content = readFileSync(path.resolve(dirname, filename), "utf8");
      const { attributes, body } = parseFrontMatter<{
        summary: string;
        title: string;
      }>(content);
      const slug = slugify(basename(filename, ".md"));
      const published = getPublishedDataTime(filename);
      const summary = attributes.summary;
      const title = attributes.title;
      return { body, published, slug, summary, title };
    })
    .filter(({ published }) => published <= morning)
    .sort((a, b) => b.published.localeCompare(a.published));
}

/**
 * Loads a news item by slug. Throws an error if:
 * - the news item is not found
 * - the slug is not provided
 * - the slug is not a valid slug
 *
 * @param slug The slug of the news item.
 * @returns The news item, published date, slug, filename, and title.
 */
export async function loadNewsItem(slug?: string): Promise<NewsItem> {
  invariant(slug, "Slug is required");
  const filename = join(dirname, `${slug}.md`);
  const post = await readFile(filename, "utf8");
  const published = getPublishedDataTime(filename);
  const { attributes, body } = parseFrontMatter<{
    summary: string;
    title: string;
  }>(post);
  const summary = attributes.summary || truncateWords(removeMd(body), 20);
  return { ...attributes, body, published, slug, summary };
}

/**
 * Gets the published date from the filename. We use the filename to get the
 * published date because the published date is stored in the filename.
 *
 * @param filename The filename of the news item.
 * @returns The published date as a DateTime object.
 */
function getPublishedDataTime(filename: string): string {
  const date = basename(filename).match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
  const published = DateTime.fromISO(`${date}T08:00:00`, {
    zone: "America/Los_Angeles",
  });
  return published.toISO() ?? "";
}
