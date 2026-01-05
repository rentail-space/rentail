import ora from "ora";
import type { Browser } from "playwright";

/**
 * Scrape the body text from a website.
 *
 * @param browser - The browser to use
 * @param center - The center to scrape
 * @returns The body text of the website
 */
export default async function scrapeCenter({
  browser,
  center,
}: {
  browser: Browser;
  center: { name: string; website: string };
}): Promise<{
  bodyText?: string;
}> {
  const page = await browser.newPage();
  const spinner = ora(`Scraping website: ${center.website}`).start();
  try {
    await page.goto(center.website, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    const bodyText = (await page.locator("body").allTextContents()).join("\n");
    spinner.succeed(`Scraped website: ${center.website}`);
    return { bodyText };
  } catch (_error) {
    spinner.fail(
      `Scraping failed: ${_error instanceof Error ? _error.message : String(_error)}`,
    );
    return {};
  } finally {
    await page.close();
  }
}
