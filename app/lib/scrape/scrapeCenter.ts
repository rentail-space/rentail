import { ms } from "convert";
import { parseHTML } from "linkedom";
import ora from "ora";
import type { Browser } from "playwright";

/**
 * Scrape the body text from a website.
 * Tries fetch+linkedom first (fast), falls back to Playwright (for JS-rendered pages).
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
  // Try fetch + linkedom first (fast path)
  try {
    const response = await fetch(center.website, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; rentail.space/1.0)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(ms("10s")),
      redirect: "follow",
    });
    if (response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) {
        const html = await response.text();
        const { document } = parseHTML(html);
        for (const el of document.querySelectorAll("script, style, noscript"))
          el.remove();
        const bodyText =
          (document.body ?? document.documentElement)?.textContent
            ?.replace(/\s+/g, " ")
            .trim() ?? "";
        if (bodyText.length > 100) {
          return { bodyText };
        }
      }
    }
  } catch {
    // Fall through to Playwright
  }

  // Fallback: Playwright (slow path for JS-rendered pages)
  const page = await browser.newPage();
  const spinner = ora(`Scraping website: ${center.website}`).start();
  try {
    await page.goto(center.website, {
      waitUntil: "domcontentloaded",
      timeout: ms("30s"),
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
