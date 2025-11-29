import { type Page, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { lastEmailHtml } from "~/emails/sendEmails";
import sendWelcomeEmail from "~/emails/WelcomeEmail";
import renderEmail from "./helpers/renderEmail";

describe("Welcome Email", () => {
  let page: Page;

  beforeAll(async () => {
    await sendWelcomeEmail({
      email: "john.doe@example.com",
      name: "John Doe",
    });
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
