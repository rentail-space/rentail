import { chromium } from "playwright";

interface ScrapedData {
  bodyText?: string;
  images?: string[];
  title?: string;
  description?: string | null;
  error?: string;
}

export default async function scrapeCenter(url: string): Promise<ScrapedData> {
  console.info("\x1b[32m  Scraping website: %s\x1b[0m", url);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { timeout: 30000 });

    const bodyText = (await page.textContent("body")) || "";
    const images = await page.$$eval("img", (imgs) =>
      imgs.map((img) => img.src).filter((src) => src.startsWith("http")),
    );
    const title = await page.title();
    const description = await page
      .$eval('meta[name="description"]', (el) => el.getAttribute("content"))
      .catch(() => null);

    await browser.close();

    return {
      bodyText,
      images,
      title,
      description,
    };
  } catch (_error) {
    await browser.close();
    console.error(
      "\x1b[31m  ⚠ Scraping failed: %s\x1b[0m",
      _error instanceof Error ? _error.message : String(_error),
    );
    return { error: "scraping_failed" };
  }
}
