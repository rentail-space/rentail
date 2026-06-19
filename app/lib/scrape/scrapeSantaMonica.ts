#!/usr/bin/env nub
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

import { normalizeSpaceType, type SpaceType } from "./types";

interface RetailSpace {
  number?: string;
  type?: SpaceType;
  size?: number;
  floor?: number;
  available?: boolean;
}

async function scrapeSantaMonica() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.info("Navigating to Santa Monica Place leasing page...");
    await page.goto("https://www.santamonicaplace.com/leasing/");

    console.info("Extracting retail space data...");
    const spaces = await page.evaluate(() => {
      const results: RetailSpace[] = [];

      // Find all list items that contain retail space information
      // These are typically in a section with heading containing "Available Retail"
      const listItems = Array.from(document.querySelectorAll("li"));

      for (const item of listItems) {
        // Look for items that have a heading (h4) followed by a nested ul
        const heading = item.querySelector("h4");
        const nestedList = item.querySelector("ul");

        if (heading && nestedList) {
          const space: RetailSpace = {};

          // Extract all the detail items from the nested list
          const details = nestedList.querySelectorAll("li");
          for (const detail of details) {
            const text = detail.textContent?.trim() || "";
            const strong = detail.querySelector("strong");
            const label = strong?.textContent?.trim().replace(":", "") || "";
            const value = text.replace(strong?.textContent || "", "").trim();

            // Map the labels to our interface properties
            switch (label.toLowerCase()) {
              case "space number":
                space.number = value;
                break;
              case "space type":
                space.type = normalizeSpaceType(value);
                break;
              case "total space sf":
              case "total space":
                space.size = Number.parseInt(value.replace(/,/g, ""), 10);
                break;
              case "floor":
                space.floor = Number.parseInt(
                  value.replace(/[a-zA-Z]/g, ""),
                  10,
                );
                break;
              case "available date":
                space.available = value.toLowerCase().includes("immediate");
                break;
            }
          }

          // Only add if we found meaningful data
          if (space.number || space.type) results.push(space);
        }
      }

      return results;
    });

    await updateSpace("ca/ca-santa-monica-place.json", spaces);
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
const spaces = await scrapeSantaMonica();
for (const space of spaces) console.info(`  ${space.number} (${space.type})`);
process.exit(0);
