import { type Page, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { lastEmailHtml } from "~/emails/sendEmails";
import sendWaitlistEmail from "~/emails/WaitlistEmail";
import renderEmail from "./helpers/renderEmail";

describe("Waitlist", () => {
  let page: Page;

  beforeAll(async () => {
    await sendWaitlistEmail({ email: "john.doe@example.com" });
    page = await renderEmail(lastEmailHtml);
  });

  it("should match inner HTML", async () => {
    await expect(page.locator("body")).toMatchInnerHTML();
  });

  it.runIf(!process.env.CI)("should match screenshot", async () => {
    await expect(page.locator("body")).toMatchScreenshot();
  });

  afterAll(async () => {
    await page?.close();
  });
});
