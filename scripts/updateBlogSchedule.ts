#!/usr/bin/env tsx
import dayjs from "dayjs";
import { invariant, partition } from "es-toolkit";
import frontMatter from "front-matter";
import { readFileSync, writeFileSync } from "node:fs";
import { readdir, rename } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

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
  const posts = (await readdir(dir))
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => join(dir, filename))
    .map((filename) => ({
      filename,
      content: readFileSync(filename, "utf8"),
      date: getDateFromFilename(basename(filename)),
    }))
    .map(({ filename, content, date }) => {
      const { attributes, body } = frontMatter<{
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
  const today = dayjs();
  return partition(posts, (post) => {
    return today.isAfter(post.date);
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
    console.log(`Updating ${post.filename} to ${currentDate}`);
    // Add one week to running date
    currentDate = dayjs(currentDate).add(1, "week").toDate();
    await renameFile({ date: currentDate, post });
  }
}

async function renameImage({ date, post }: { date: Date; post: BlogPost }) {
  const imageFilenameParts = post.attributes.image.split("-");
  const newDatePrefix = dayjs(date).format("YYYY-MM-DD");
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
    `${dayjs(date).format("YYYY-MM-DD")}-`,
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
