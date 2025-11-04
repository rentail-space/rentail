#!/usr/bin/env tsx
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

interface Space {
  spaceNumber: string;
  spaceType?: "Cart" | "Inline" | "Storage";
  totalSpace?: number;
  floor?: number;
  availableDate?: string;
  imageUrl?: string;
}

async function scrapeSpaces() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("Navigating to Los Cerritos Center leasing page...");
    await page.goto(
      "https://quikspace.macerich.com/commercial-property/us/ca/downey/stonewood-center-1/",
      { waitUntil: "domcontentloaded" },
    );

    console.log("Extracting space data...");
    const spaces = await page.evaluate(() => {
      const results: Space[] = [];
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

          const space: Space = { spaceNumber };

          // Extract space type (Cart, Inline, Storage, etc.)
          const typeMatch = text.match(
            /Space Type[:\s]+([^\n\r]+?)(?:\n|$|Cart|Inline|Storage)/i,
          );
          if (typeMatch) {
            const type = typeMatch[1].trim() as "Cart" | "Inline" | "Storage";
            if (type && !type.includes("Space") && type.length < 20)
              space.spaceType = type;
          }

          // Try another approach for space type
          if (!space.spaceType) {
            if (text.match(/\bCart\b/)) space.spaceType = "Cart";
            else if (text.match(/\bInline\b/)) space.spaceType = "Inline";
            else if (text.match(/\bStorage\b/)) space.spaceType = "Storage";
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
            if (available >= 50) space.totalSpace = available;
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
          if (dateMatch) space.availableDate = dateMatch[1].trim();

          // Only add spaces with at least spaceType and floor
          if (space.spaceType && space.floor) {
            // Avoid duplicates
            const isDuplicate = results.some(
              (r) => r.spaceNumber === space.spaceNumber,
            );
            if (!isDuplicate) results.push(space);
          }
        }
      }

      return results;
    });

    console.log(`Found ${spaces.length} spaces`);

    // Try to find and associate images
    const imageDirs = resolve("stonewood-images");
    if (!existsSync(imageDirs)) {
      await mkdir(imageDirs, { recursive: true });
    }

    // Look for images related to each space
    for (const space of spaces) {
      try {
        const imageUrl = await page.evaluate((spaceNum: string) => {
          const images = Array.from(document.querySelectorAll("img"));
          for (const img of images) {
            const alt = img.getAttribute("alt") || "";
            const src = img.getAttribute("src") || "";

            if (alt.includes(spaceNum) || src.includes(spaceNum)) {
              return src.startsWith("http") ? src : undefined;
            }
          }
          return undefined;
        }, space.spaceNumber);

        if (imageUrl) {
          console.log(`Found image for space ${space.spaceNumber}`);
          space.imageUrl = imageUrl;
        }
      } catch (e) {
        // Silent fail for image search
      }
    }

    // Write to JSON file
    const outputPath = "./stonewood-center-spaces.json";
    await writeFile(outputPath, JSON.stringify(spaces, null, 2));
    console.log("Data written to %s", outputPath);

    // Print preview
    console.log("\nPreview of scraped data:");
    console.log(JSON.stringify(spaces.slice(0, 10), null, 2));

    return spaces;
  } finally {
    await browser.close();
  }
}

// Run the scraper
scrapeSpaces()
  .then((spaces) => {
    console.log(`\n✅ Successfully scraped ${spaces.length} spaces`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error scraping spaces:", error);
    process.exit(1);
  });
