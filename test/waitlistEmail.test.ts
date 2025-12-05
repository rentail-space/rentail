import { delay } from "es-toolkit";
import { type Page, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { type LastEmail, getLastEmailSent } from "~/emails/sendEmails";
import prisma from "~/lib/prisma";
import { goto, renderEmail } from "./helpers/launchBrowser";

describe("Waitlist", () => {
  let homePage: Page;

  beforeAll(async () => {
    await prisma.waitlist.deleteMany();
    homePage = await goto("/");

    const emailInput = homePage.getByPlaceholder("your.email@example.com");
    await emailInput.scrollIntoViewIfNeeded();
    await emailInput.focus();
    await emailInput.pressSequentially("john.doe@example.com");
    await emailInput.press("Enter");

    let count = await prisma.waitlist.count();
    while (count === 0) {
      await delay(100);
      count = await prisma.waitlist.count();
    }
  });

  it("should add email to waitlist", async () => {
    const waitlist = await prisma.waitlist.findMany();
    expect(waitlist, "Should have one email in the waitlist").toHaveLength(1);
    expect(waitlist[0].email, "Should have the correct email").toBe(
      "john.doe@example.com",
    );
  });

  it("should show a success message", async () => {
    await expect(
      homePage
        .getByRole("alert")
        .getByText(/thank you for joining our waitlist! 🚀/i),
    ).toBeVisible();
  });

  describe("email content", () => {
    let lastEmail: LastEmail | undefined;
    let emailPage: Page;

    beforeAll(async () => {
      lastEmail = await getLastEmailSent();
      emailPage = await renderEmail(lastEmail?.html);
    });

    it("should have sent the email", async () => {
      expect(lastEmail).toBeDefined();
    });

    it("should have the correct recipient", async () => {
      expect(lastEmail?.to).toContain("john.doe@example.com");
    });

    it("should have the correct subject", async () => {
      expect(lastEmail?.subject).toBe("Thank you for joining our waitlist! 🚀");
    });

    it("should match inner HTML", async () => {
      await expect(emailPage.locator("body")).toMatchInnerHTML({
        name: "waitlist-email",
      });
    });

    it("should match screenshot", async () => {
      await expect(emailPage.locator("body")).toMatchScreenshot({
        name: "waitlist-email",
      });
    });
  });

  afterAll(async () => {
    await homePage?.close();
  });
});
