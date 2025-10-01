import { pretty, render } from "@react-email/components";
import { expect, type Page } from "playwright/test";
import { afterEach, beforeEach, describe, it } from "vitest";
import Welcome from "~/emails/Welcome";
import { openPage } from "./helpers/launchBrowser";

describe("Welcome Email", () => {
  let page: Page;

  beforeEach(async () => {
    page = await openPage();
  });

  it("renders welcome email with correct styling and layout", async () => {
    // Render the email component to HTML
    const html = await pretty(await render(<Welcome name="John Doe" />));

    // Create a full HTML page with the email content
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome Email</title>
        </head>
        <body style="margin: 0; padding: 20px;">
          ${html}
        </body>
      </html>
    `;

    // Set the page content and wait for it to load
    await page.setContent(fullHtml, { waitUntil: "networkidle" });

    // Take a screenshot for visual regression testing
    await expect(page).toMatchScreenshot();
  });

  afterEach(async () => {
    if (page) await page.close();
  });
});
