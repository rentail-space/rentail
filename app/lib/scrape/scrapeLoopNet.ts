import { chromium } from "playwright";

interface LoopNetData {
  description?: string;
  leasableArea?: number;
  numberOfProperties?: number;
  images?: string[];
  error?: string;
}

export default async function scrapeLoopNet(
  centerName: string,
  city: string,
  state: string,
): Promise<LoopNetData> {
  console.info(
    "\x1b[32m  Scraping LoopNet: %s, %s %s\x1b[0m",
    centerName,
    city,
    state,
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Construct search query: "Center Name City State"
    const searchQuery = `${centerName} ${city} ${state}`;
    const searchUrl = `https://www.loopnet.com/search/retail-space/for-lease/?sk=${encodeURIComponent(searchQuery)}`;

    await page.goto(searchUrl, { timeout: 30_000 });
    await page.waitForLoadState("networkidle", { timeout: 10_000 });

    // Find first search result and navigate to it
    const firstResult = await page
      .locator('[data-testid="property-card"] a')
      .first();
    const resultUrl = await firstResult.getAttribute("href");

    if (!resultUrl) {
      await browser.close();
      console.warn("\x1b[33m  ⚠ No LoopNet results found\x1b[0m");
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

    console.info(
      "\x1b[32m  ✓ LoopNet data: %s sqft, %d buildings, %d images\x1b[0m",
      leasableArea?.toLocaleString() || "unknown",
      numberOfProperties || 0,
      images.length,
    );

    return {
      description: description || undefined,
      leasableArea,
      numberOfProperties,
      images: images.length > 0 ? images : undefined,
    };
  } catch (error) {
    await browser.close();
    console.error(
      "\x1b[31m  ⚠ LoopNet scraping failed: %s\x1b[0m",
      error instanceof Error ? error.message : String(error),
    );
    return { error: "scraping_failed" };
  }
}
