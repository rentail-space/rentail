#!/usr/bin/env tsx
import { invariant, partition } from "es-toolkit";
import { DateTime } from "luxon";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { rename } from "node:fs/promises";
import path, { basename, resolve } from "node:path";
import parseFrontMatter from "~/lib/parseFrontMatter";

/**
 * This script updates the blog schedule by renaming the files and updating the frontmatter.
 * It is used to ensure that the blog posts are published in the correct order and that the
 * frontmatter is updated correctly.
 *
 * It is run manually when the blog schedule is updated.
 */

type BlogPost = {
  filename: string;
  content: string;
  date: Date;
  body: string;
  attributes: {
    title: string;
    image: string;
    alt: string;
    summary: string;
  };
};

const dir = resolve("app/data/blog");
const [past, future] = await splitPosts();
await updateFuturePosts(past, future);

async function splitPosts(): Promise<[BlogPost[], BlogPost[]]> {
  const posts = readdirSync(dir)
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => path.resolve(dir, filename))
    .map((filename) => ({
      filename,
      content: readFileSync(filename, "utf8"),
      date: getDateFromFilename(basename(filename)),
    }))
    .map(({ filename, content, date }) => {
      const { attributes, body } = parseFrontMatter<{
        title: string;
        image: string;
        alt: string;
        summary: string;
      }>(content);
      return {
        filename,
        content,
        date,
        attributes,
        body,
      };
    });
  const today = DateTime.now();
  return partition(posts, (post) => {
    return today.diff(DateTime.fromJSDate(post.date), "days").days < 0;
  });
}

async function getRecentDate(past: { date: Date }[]) {
  const mostRecentPastOrToday = past
    .map((post) => post.date)
    .filter((date): date is Date => date instanceof Date)
    .reduce(
      (latest, current) => {
        return !latest || current > latest ? current : latest;
      },
      null as Date | null,
    );
  return mostRecentPastOrToday ?? new Date();
}

async function updateFuturePosts(past: BlogPost[], future: BlogPost[]) {
  // Sort futurePosts alphabetically by filename (as requested)
  future.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Set running date to the most recent past or today post's date, or to today if none
  let currentDate = await getRecentDate(past);
  // Sequentially update futurePosts, awaiting each rename
  for (const post of future) {
    console.info(`Updating ${post.filename} to ${currentDate}`);
    // Add one week to running date
    currentDate = DateTime.fromJSDate(currentDate)
      .plus({ weeks: 1 })
      .toJSDate();
    await renameFile({ date: currentDate, post });
  }
}

async function renameImage({ date, post }: { date: Date; post: BlogPost }) {
  const imageFilenameParts = post.attributes.image.split("-");
  const newDatePrefix = DateTime.fromJSDate(date).toFormat("yyyy-MM-dd");
  const newImageFilename = `${newDatePrefix}-${imageFilenameParts.slice(3).join("-")}`;
  await rename(
    resolve(dir, post.attributes.image),
    resolve(dir, newImageFilename),
  );
  post.attributes.image = newImageFilename;
}

async function renameFile({ date, post }: { date: Date; post: BlogPost }) {
  await renameImage({ date, post });

  const newFilename = post.filename.replace(
    /^\d{4}-\d{2}-\d{2}-/,
    `${DateTime.fromJSDate(date).toFormat("yyyy-MM-dd")}-`,
  );
  await rename(post.filename, newFilename);

  // Convert attributes into YAML, ensuring proper encoding and escaping of strings
  const yamlSafeString = (str: string) => {
    // If the string contains special characters, linebreaks, or leading/trailing spaces, quote it
    // Use JSON.stringify for safe double-quoting with escape
    if (str === "" || /[:\-?[\]{},&*@!#|>%\n\r\t'"`]|^\s|\s$/.test(str)) {
      return JSON.stringify(str);
    }
    return str;
  };

  // Build YAML frontmatter from attributes
  const frontmatter = Object.entries(post.attributes)
    .map(([key, value]) => `${key}: ${yamlSafeString(String(value))}`)
    .join("\n");

  writeFileSync(
    post.filename,
    `---\n${frontmatter}\n---\n\n${post.body.trim()}`,
  );
}

// Helper to get date from filename (expects YYYY-MM-DD-something.md)
function getDateFromFilename(filename: string): Date {
  const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})-/);
  invariant(match, "Invalid filename");
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}
