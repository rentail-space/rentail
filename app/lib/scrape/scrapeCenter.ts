import ora from "ora";
import type { Browser } from "playwright";

export default async function scrapeCenter({
  browser,
  url,
}: {
  browser: Browser;
  url: string;
}): Promise<{
  bodyText?: string;
  description?: string | null;
}> {
  const page = await browser.newPage();
  const spinner = ora(`Scraping website: ${url}`).start();
  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    const bodyText = (await page.textContent("body")) || "";
    const description = await page
      .$eval('meta[name="description"]', (el) => el.getAttribute("content"))
      .catch(() => null);

    await browser.close();
    spinner.succeed(`Scraped website: ${url}`);

    return { bodyText, description };
  } catch (_error) {
    await page.close();
    spinner.fail(
      `Scraping failed: ${_error instanceof Error ? _error.message : String(_error)}`,
    );
    return {};
  }
}
