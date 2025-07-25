import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
} from "playwright";

let browser: Browser | undefined;
let context: BrowserContext | undefined;

export async function launchBrowser(): Promise<Page> {
  if (!browser) browser = await chromium.launch();
  if (!context) context = await browser.newContext();
  return await context.newPage();
}
