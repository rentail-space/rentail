import { expect, type Page } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import Waitlist from "~/emails/Waitlist";
import { renderLastEmailSent, sendEmail } from "~/lib/resend";
import { openPage } from "./helpers/launchBrowser";

describe("Waitlist", () => {
  let page: Page;

  beforeAll(async () => {
    page = await openPage();
  });

  it("renders waitlist email with correct styling and layout", async () => {
    await sendEmail({
      email: "john.doe@example.com",
      subject: "You're on the waitlist!",
      component: ({ subject }) => <Waitlist subject={subject} />,
    });
    await renderLastEmailSent(page);

    // Take a screenshot for visual regression testing
    await expect(page).toMatchScreenshot();
  });

  afterAll(async () => {
    if (page) await page.close();
  });
});
