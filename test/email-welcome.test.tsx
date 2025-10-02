import { expect, type Page } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import Welcome from "~/emails/Welcome";
import { openPage } from "~/test/helpers/launchBrowser";
import renderEmail from "~/test/helpers/renderEmail";

describe("Welcome Email", () => {
  let page: Page;

  beforeAll(async () => {
    page = await openPage();
  });

  it("renders welcome email with correct styling and layout", async () => {
    await renderEmail(page, <Welcome name="John Doe" />);

    // Take a screenshot for visual regression testing
    await expect(page).toMatchScreenshot();
  });

  afterAll(async () => {
    if (page) await page.close();
  });
});
