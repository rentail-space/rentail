import ora from "ora";
import { chromium } from "playwright";

export default async function scrapeCenter(url: string): Promise<{
  bodyText?: string;
  description?: string | null;
}> {
  const spinner = ora(`Scraping website: ${url}`).start();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { timeout: 30_000 });

    const bodyText = (await page.textContent("body")) || "";
    const description = await page
      .$eval('meta[name="description"]', (el) => el.getAttribute("content"))
      .catch(() => null);

    await browser.close();
    spinner.succeed(`Scraped website: ${url}`);

    return { bodyText, description };
  } catch (_error) {
    await browser.close();
    spinner.fail(
      `Scraping failed: ${_error instanceof Error ? _error.message : String(_error)}`,
    );
    return {};
  }
}
