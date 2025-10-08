import { expect, type Page } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { lastEmailHtml, sendWaitlistEmail } from "~/emails/sendEmails";
import renderEmail from "./helpers/renderEmail";

describe("Waitlist", () => {
  let page: Page;

  beforeAll(async () => {
    await sendWaitlistEmail({ email: "john.doe@example.com" });
    page = await renderEmail(lastEmailHtml);
  });

  it("renders waitlist email with correct styling and layout", async () => {
    // Take a screenshot for visual regression testing
    await expect(page).toMatchScreenshot();
  });

  afterAll(async () => {
    await page.close();
  });
});
