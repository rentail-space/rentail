import { expect, type Page } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import Waitlist from "~/emails/Waitlist";
import { lastEmailHtml, sendEmail } from "~/lib/resend";
import renderEmail from "./helpers/renderEmail";

describe("Waitlist", () => {
  let page: Page;

  beforeAll(async () => {
    await sendEmail({
      email: "john.doe@example.com",
      subject: "You're on the waitlist!",
      component: ({ subject }) => <Waitlist subject={subject} />,
    });
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
