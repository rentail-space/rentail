import { expect, type Page } from "playwright/test";
import { afterEach, beforeEach, describe, it } from "vitest";
import Waitlist from "~/emails/Waitlist";
import { openPage } from "./helpers/launchBrowser";
import renderEmail from "./helpers/renderEmail";

describe("Waitlist Email", () => {
  let page: Page;

  beforeEach(async () => {
    page = await openPage();
  });

  it("renders waitlist email with correct styling and layout", async () => {
    await renderEmail(page, <Waitlist subject="You're on the waitlist!" />);

    // Take a screenshot for visual regression testing
    await expect(page).toMatchScreenshot();
  });

  afterEach(async () => {
    if (page) await page.close();
  });
});
