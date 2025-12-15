import ora from "ora";
import type { Browser } from "playwright";

/**
 * Scrape the body text from a website.
 *
 * @param browser - The browser to use
 * @param url - The URL of the website to scrape
 * @returns The body text of the website
 */
export default async function scrapeCenter({
  browser,
  url,
}: {
  browser: Browser;
  url: string;
}): Promise<{
  bodyText?: string;
}> {
  const page = await browser.newPage();
  const spinner = ora(`Scraping website: ${url}`).start();
  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    const bodyText = (await page.textContent("body")) || "";

    spinner.succeed(`Scraped website: ${url}`);
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
