import { type Page, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { lastEmailHtml, sendWaitlistEmail } from "~/emails/sendEmails";
import renderEmail from "./helpers/renderEmail";

describe("Waitlist", () => {
  let page: Page;

  beforeAll(async () => {
    await sendWaitlistEmail({ email: "john.doe@example.com" });
    page = await renderEmail(lastEmailHtml);
  });

  it("should match inner HTML", async () => {
    await expect(page).toMatchInnerHTML();
  });

  it.runIf(!process.env.CI)("should match screenshot", async () => {
    await expect(page).toMatchScreenshot();
  });

  afterAll(async () => {
    await page.close();
  });
});
