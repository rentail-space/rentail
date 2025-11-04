import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";

interface RetailSpace {
  name: string;
  spaceNumber?: string;
  spaceType?: string;
  totalSpaceSF?: string;
  floor?: string;
  leaseRate?: string;
  additionalRent?: string;
  availableDate?: string;
}

async function scrapeRetailSpaces() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("Navigating to Santa Monica Place leasing page...");
    await page.goto("https://www.santamonicaplace.com/leasing/", {
      waitUntil: "domcontentloaded",
    });

    console.log("Extracting retail space data...");
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
          const space: RetailSpace = {
            name: heading.textContent?.trim() || "",
          };

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
                space.spaceNumber = value;
                break;
              case "space type":
                space.spaceType = value;
                break;
              case "total space sf":
              case "total space":
                space.totalSpaceSF = value;
                break;
              case "floor":
                space.floor = value;
                break;
              case "lease rate":
                space.leaseRate = value;
                break;
              case "additional rent":
                space.additionalRent = value;
                break;
              case "available date":
                space.availableDate = value;
                break;
            }
          }

          // Only add if we found meaningful data
          if (space.spaceNumber || space.spaceType) results.push(space);
        }
      }

      return results;
    });

    console.log("Found %d retail spaces", spaces.length);

    // Write to JSON file
    const outputPath = "./santa-monica-place-retail.json";
    await writeFile(outputPath, JSON.stringify(spaces, null, 2));
    console.log("Data written to %s", outputPath);
  } finally {
    await browser.close();
  }
}

// Run the scraper
scrapeRetailSpaces()
  .then((spaces) => {
    console.log(`\n✅ Successfully scraped ${spaces.length} retail spaces`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error scraping retail spaces:", error);
    process.exit(1);
  });
