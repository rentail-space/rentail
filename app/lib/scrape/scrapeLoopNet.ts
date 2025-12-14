import ora from "ora";
import { chromium } from "playwright";

/**
 * Scrape LoopNet for a given center name. LoopNet is a website that lists
 * commercial properties for lease. It has information about centers that we
 * don't find elsewhere.
 *
 * @param centerName - The name of the center to scrape.
 * @returns The LoopNet data for the center.
 */
export default async function scrapeLoopNet({
  centerName,
  city,
  state,
}: {
  centerName: string;
  city: string;
  state: string;
}): Promise<{
  description?: string;
  leasableArea?: number;
  numberOfProperties?: number;
  images?: string[];
  error?: string;
}> {
  const spinner = ora(
    `Scraping LoopNet: ${centerName}, ${city}, ${state}`,
  ).start();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Construct search query: "Center Name City State"
    const searchQuery = `${centerName} ${city} ${state}`;
    const searchUrl = `https://www.loopnet.com/search/retail-space/for-lease/?sk=${encodeURIComponent(searchQuery)}`;

    await page.goto(searchUrl, { timeout: 30_000 });
    await page.waitForLoadState("networkidle", { timeout: 10_000 });

    // Find first search result and navigate to it
    const firstResult = page.locator('[data-testid="property-card"] a').first();
    const resultUrl = await firstResult.getAttribute("href");

    if (!resultUrl) {
      await browser.close();
      spinner.fail("No LoopNet results found");
      return { error: "no_results" };
    }

    // Navigate to property detail page
    const fullUrl = resultUrl.startsWith("http")
      ? resultUrl
      : `https://www.loopnet.com${resultUrl}`;
    await page.goto(fullUrl, { timeout: 30_000 });
    await page.waitForLoadState("networkidle", { timeout: 10_000 });

    // Extract data
    const description = await page
      .locator('[data-testid="property-description"]')
      .textContent()
      .catch(() => null);

    const leasableAreaText = await page
      .locator('text="Leasable Area"')
      .locator("..")
      .textContent()
      .catch(() => null);
    const leasableArea = leasableAreaText
      ? Number.parseInt(leasableAreaText.replace(/[^0-9]/g, ""), 10)
      : undefined;

    const numberOfPropertiesText = await page
      .locator('text="Number of Buildings"')
      .locator("..")
      .textContent()
      .catch(() => null);
    const numberOfProperties = numberOfPropertiesText
      ? Number.parseInt(numberOfPropertiesText.replace(/[^0-9]/g, ""), 10)
      : undefined;

    const images = await page
      .$$eval('[data-testid="property-images"] img', (imgs) =>
        imgs
          .map((img) => (img as HTMLImageElement).src)
          .filter((src) => src.startsWith("http")),
      )
      .catch(() => []);

    await browser.close();

    spinner.succeed(
      `LoopNet data: ${leasableArea?.toLocaleString() || "unknown"} sqft, ${numberOfProperties || 0} buildings, ${images.length} images`,
    );

    return {
      description: description || undefined,
      leasableArea,
      numberOfProperties,
      images: images.length > 0 ? images : undefined,
    };
  } catch (error) {
    await browser.close();
    spinner.fail(
      `LoopNet scraping failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return { error: "scraping_failed" };
  }
}
