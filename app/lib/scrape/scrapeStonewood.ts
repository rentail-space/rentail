#!/usr/bin/env nub
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import ora from "ora";
import { chromium } from "playwright";

import { normalizeSpaceType, type SpaceType } from "./types";

interface RetailSpace {
  number: string;
  type?: SpaceType;
  size?: number;
  floor?: number;
  available?: boolean;
  imageURLs?: string[];
}

async function scrapeStonewood() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const spinner = ora("Scraping Stonewood Center...").start();

  try {
    await page.goto(
      "https://quikspace.macerich.com/commercial-property/us/ca/downey/stonewood-center-1/",
    );

    const spaces = await page.evaluate(() => {
      const results: RetailSpace[] = [];
      const nodes = document.querySelectorAll(".space");
      for (const node of nodes) {
        const text = node.textContent;

        // Check if this container has space information
        const hasFloor = text.includes("Floor");
        const isCart = text.includes("Cart");
        const isInline = text.includes("Inline");
        const isValidContainer = hasFloor && (isCart || isInline);

        if (isValidContainer) {
          // Extract space number - look for pattern like "B45", "J25", etc.
          const spaceMatch = text.match(/Space Number\s+([A-Z0-9]+)/m);
          if (!spaceMatch) continue;
          const spaceNumber = spaceMatch[1];
          if (!spaceNumber) continue;

          const space: RetailSpace = { number: spaceNumber };

          // Extract space type (Cart, Inline, Storage, etc.)
          const typeMatch = text.match(
            /Space Type[:\s]+([^\n\r]+?)(?:\n|$|Cart|Inline|Storage)/i,
          );
          if (typeMatch) {
            const type = normalizeSpaceType(typeMatch[1]);
            if (
              type &&
              !typeMatch[1].includes("Space") &&
              typeMatch[1].trim().length < 20
            )
              space.type = type;
          }

          // Try another approach for space type
          if (!space.type) {
            if (text.match(/\bCart\b/)) space.type = "Cart";
            else if (text.match(/\bInline\b/)) space.type = "Inline";
            else if (text.match(/\bStorage\b/)) space.type = "Storage";
          }

          // Extract total space (usually in SF)
          const totalMatch = text.match(
            /Total Space Available[:\s]*([^\n\r]+?(?:sf|SF))/i,
          );
          if (totalMatch) {
            const available = Number.parseInt(
              totalMatch[1].trim().replace(/,/g, ""),
              10,
            );
            if (available >= 50) space.size = available;
          }

          // Extract floor
          const floorMatch = text.match(
            /Floor[:\s]+([^\n\r]+?)(?:\n|$|Available|Lease)/i,
          );
          if (floorMatch) {
            const floorName = floorMatch[1].trim();
            const floorNumber = Number.parseInt(
              floorName.replace(/[a-zA-Z]/g, ""),
              10,
            );
            if (floorNumber && floorNumber < 10) space.floor = floorNumber;
          }

          // Extract available date
          const dateMatch = text.match(
            /Available Date[:\s]+([^\n\r]+?)(?:\n|$|Lease|Contact)/i,
          );
          space.available = dateMatch
            ? dateMatch[1].trim().toLowerCase().includes("immediate")
            : false;

          // Only add spaces with at least spaceType and floor
          if (space.type && space.floor) {
            // Avoid duplicates
            const isDuplicate = results.some((r) => r.number === space.number);
            if (!isDuplicate) results.push(space);
          }
        }
      }

      return results;
    });
    await updateSpace("ca/ca-stonewood-center.json", spaces);
    spinner.succeed(`Found ${spaces.length} spaces`);
    return spaces;
  } finally {
    await browser.close();
  }
}

async function updateSpace(filename: string, spaces: RetailSpace[]) {
  const file = resolve("prisma/seed/", filename);
  const json = await readFile(file, "utf-8");
  const center = JSON.parse(json);
  center.spaces = spaces;
  await writeFile(file, JSON.stringify(center, null, 2));
  console.info("Spaces updated in %s", filename);
}

// Run the scraper
const spaces = await scrapeStonewood();
for (const space of spaces) console.info(`  ${space.number} (${space.type})`);
process.exit(0);
