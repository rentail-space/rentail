import { pretty, render } from "@react-email/components";
import { expect, type Page } from "playwright/test";
import { afterEach, beforeEach, describe, it } from "vitest";
import Welcome from "~/emails/Welcome";
import { openPage } from "./helpers/launchBrowser";
import renderEmail from "./helpers/renderEmail";

describe("Welcome Email", () => {
  let page: Page;

  beforeEach(async () => {
    page = await openPage();
  });

  it("renders welcome email with correct styling and layout", async () => {
    await renderEmail(page, <Welcome name="John Doe" />);

    // Take a screenshot for visual regression testing
    await expect(page).toMatchScreenshot();
  });

  afterEach(async () => {
    if (page) await page.close();
  });
});
