import { expect, type Page } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { renderLastEmailSent } from "~/lib/resend";
import sendWelcomeEmail from "~/lib/sendWelcomeEmail";
import { openPage } from "~/test/helpers/launchBrowser";

describe("Welcome Email", () => {
  let page: Page;

  beforeAll(async () => {
    page = await openPage();
  });

  it("renders welcome email with correct styling and layout", async () => {
    await sendWelcomeEmail({
      email: "john.doe@example.com",
      name: "John Doe",
    });
    await renderLastEmailSent(page);

    // Take a screenshot for visual regression testing
    await expect(page).toMatchScreenshot();
  });

  afterAll(async () => {
    if (page) await page.close();
  });
});
