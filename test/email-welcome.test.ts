import { expect, type Page } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { lastEmailHtml } from "~/lib/resend";
import sendWelcomeEmail from "~/lib/sendWelcomeEmail";
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

  it("renders welcome email with correct styling and layout", async () => {
    // Take a screenshot for visual regression testing
    await expect(page).toMatchScreenshot();
  });
});
