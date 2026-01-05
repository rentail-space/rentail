import { Output, generateText } from "ai";
import ora from "ora";
import type { Browser } from "playwright";
import { z } from "zod";
import { classify } from "~/lib/models";

const spaceSchema = z.object({
  number: z.string().optional(),
  type: z.enum(["Cart", "Inline", "Storage", "Other"]),
  size: z.number().optional().describe("Size in square feet"),
  floor: z.number().optional(),
  available: z.boolean().optional().default(false),
  imageURLs: z.array(z.string()).optional(),
});

/**
 * Scrape available retail spaces from a shopping center's website using AI
 * to extract structured data from the HTML.
 *
 * This function attempts to find the leasing/spaces page and extract all
 * available retail space listings with their details (number, type, size, etc.)
 *
 * @param websiteUrl - The center's main website URL
 * @param centerName - The name of the center (for logging)
 * @returns Array of retail space objects
 */
export default async function scrapeSpaces({
  browser,
  centerName,
  url,
}: {
  browser: Browser;
  centerName: string;
  url: string;
}): Promise<z.infer<typeof spaceSchema>[]> {
  const page = await browser.newPage();
  const spinner = ora(`Scraping spaces for ${centerName}...`).start();

  try {
    // Navigate to main website
    await page.goto(url, { timeout: 30_000 });
    await page.waitForLoadState("networkidle", { timeout: 10_000 });

    // Try to find and click on leasing/spaces link
    const leasingLinks = [
      'a[href*="leasing"]',
      'a[href*="spaces"]',
      'a[href*="available"]',
      'a:has-text("Leasing")',
      'a:has-text("Available Spaces")',
      'a:has-text("Retail Spaces")',
    ];

    for (const selector of leasingLinks) {
      try {
        const link = page.locator(selector).first();
        if (await link.isVisible()) {
          await link.click();
          await page.waitForLoadState("networkidle", { timeout: 10_000 });
          break;
        }
      } catch {
        // Continue to next selector
      }
    }

    // Extract page content
    const bodyText = (await page.textContent("body")) || "";

    // Extract images that might be related to spaces
    const images = await page
      .$$eval("img", (imgs) =>
        imgs
          .map((img) => ({
            src: (img as HTMLImageElement).src,
            alt: img.getAttribute("alt") || "",
          }))
          .filter((img) => img.src.startsWith("http")),
      )
      .catch(() => []);

    // Use AI to extract space data
    spinner.text = `Extracting space data for ${centerName}...`;

    const prompt = `Extract all available retail space listings from this shopping center website.

Website: ${centerName}

<body>
${bodyText.slice(0, 15000)}
</body>

Look for patterns like:
- Space numbers (e.g., "A101", "B-45", "Suite 200")
- Space types: Cart, Inline, Storage, or Other
- Size in square feet (SF)
- Floor number (1-10)
- Availability status (available now, coming soon, etc.)

Common patterns to look for:
- QuikSpace/Macerich: ".space" elements with "Space Number", "Space Type", "Total Space Available", "Floor"
- Structured lists with labels like "Space:", "Size:", "Type:", "Floor:"
- Tables with space information
- Any section containing multiple retail space listings

Return ALL spaces found. If you can match images to specific spaces based on space numbers in alt text or filenames, include those URLs.

Available images:
${images.map((img) => `- ${img.alt}: ${img.src}`).join("\n")}

If no spaces are found or the page doesn't contain leasing information, return an empty array.`;

    const { output } = await generateText({
      abortSignal: AbortSignal.timeout(60_000),
      prompt,
      output: Output.array({ element: spaceSchema }),
      ...classify,
    });
    spinner.succeed(`Found ${output.length} spaces for ${centerName}`);
    return output;
  } catch (error) {
    spinner.fail(
      `Failed to scrape spaces for ${centerName}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return [];
  } finally {
    await page.close();
  }
}
