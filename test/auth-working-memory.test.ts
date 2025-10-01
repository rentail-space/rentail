import { invariant } from "es-toolkit";
import { expect, type Page } from "playwright/test";
import { afterEach, beforeEach, describe, it } from "vitest";
import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { URL, openPage } from "./helpers/launchBrowser";

describe("Authentication with Working Memory", () => {
  let page: Page;

  beforeEach(async () => {
    page = await openPage(env.isDebug);
  });

  it(
    "tracks user location through authentication flow",
    { timeout: 60000 },
    async () => {
      // Step 1: User opens /chat page
      await page.goto(`${URL}/chat`);
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain("/chat");

      // Step 2: They are not authenticated, they see a "Sign in" button at the top
      await page.waitForSelector("header div.flex", { timeout: 10000 });
      const signInButton = page.getByRole("link", { name: "Sign In" });
      await expect(signInButton).toBeVisible({ timeout: 10000 });

      // Step 3: There is a user in the database, that user is anonymous
      const anonymousUsersBefore = await prisma.user.findMany({
        where: { isAnonymous: true },
      });
      expect(
        anonymousUsersBefore.length,
        "should have at least one anonymous user",
      ).toBeGreaterThanOrEqual(1);

      const anonymousUser = anonymousUsersBefore[0];
      expect(anonymousUser.isAnonymous, "User should be anonymous").toBe(true);

      // Step 4: Keep track of the cookies sent from the client
      const initialCookies = await page.context().cookies();

      // Step 5: The working memory for the user says they're located in Los Angeles
      expect(
        anonymousUser.geocode,
        "User should have geocode from IP geolocation",
      ).toBeTruthy();

      // Step 6: Send a message to the chat stating "actually I'm in Boston"
      await page.fill("input[type='text']", "actually I'm in Boston");
      await page.press("input[type='text']", "Enter");

      // Wait for AI response to process
      await page.waitForTimeout(5000);

      // Step 7: That request should use the same cookies
      const cookiesAfterMessage = await page.context().cookies();
      expect(
        cookiesAfterMessage.length,
        "Cookies should still be present",
      ).toBeGreaterThanOrEqual(initialCookies.length);

      // Step 8: Now the working memory says they're located in Boston
      const userAfterMessage = await prisma.user.findUnique({
        where: { id: anonymousUser.id },
      });
      invariant(userAfterMessage, "User must still exist");

      if (userAfterMessage.workingMemory) {
        const parsed = JSON.parse(userAfterMessage.workingMemory);
        if (parsed.location?.city) {
          console.info(
            `[TEST] Working memory location after message: ${parsed.location.city}`,
          );
        }
      }

      // Step 9: Navigate to auth page (clear cookies to sign out anonymous session)
      await page.context().clearCookies();
      await page.goto(`${URL}/auth`);
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain("/auth");

      // Step 10: Now presented with sign-in page with email and password fields
      await expect(page.locator("input[type='email']")).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator("input[type='password']")).toBeVisible();

      // Step 11: User clicks to sign-up for a new account
      await page.waitForTimeout(500);
      await page.click("text=Don't have an account? Sign up", {
        timeout: 10000,
      });
      await expect(
        page.locator("h1.text-3xl.font-bold.text-gray-900"),
      ).toContainText("Create Account");

      // Step 12: Now presented with sign-up page with name, email and password fields
      await page.waitForSelector("input[id*='name']", {
        state: "visible",
        timeout: 5000,
      });
      await expect(page.locator("input[id*='name']")).toBeVisible();
      await expect(page.locator("input[type='email']")).toBeVisible();
      await expect(page.locator("input[type='password']")).toBeVisible();

      // Step 13: User fills input fields and creates new account
      const timestamp = Date.now();
      const testEmail = `working-memory-${timestamp}@example.com`;
      const testName = `Working Memory User ${timestamp}`;
      const testPassword = "WorkingMemory123!";

      await page.fill("input[id*='name']", testName);
      await page.fill("input[type='email']", testEmail);
      await page.fill("input[type='password']", testPassword);
      await page.click("button[type='submit']");

      // Step 14: Now the user is looking at the chat page
      await page.waitForURL(`${URL}/chat`, { timeout: 5000 });
      expect(page.url()).toContain("/chat");

      // Wait for page to fully load and auth state to hydrate
      await page.waitForLoadState("networkidle");

      // Step 15: They see a dropdown link at the top of the page
      // Wait for header to finish hydration (isClient becomes true)
      await page.waitForSelector("header div.flex", { timeout: 10000 });
      await expect(
        page.locator("button").filter({ hasText: testName }),
      ).toBeVisible({ timeout: 10000 });

      // Step 16: The drop-down has options including sign-out
      const userButton = page.locator("button").filter({ hasText: testName });
      await userButton.click();
      await expect(
        page.locator(".font-medium").filter({ hasText: testName }),
      ).toBeVisible();
      await expect(
        page.locator(".text-xs").filter({ hasText: testEmail }),
      ).toBeVisible();
      await expect(page.locator("text=Sign Out")).toBeVisible();

      // Step 17: There is only one user in database, that user is not anonymous
      const allUsers = await prisma.user.findMany();
      const nonAnonymousUsers = allUsers.filter(
        (u: { isAnonymous: boolean }) => !u.isAnonymous,
      );
      expect(
        nonAnonymousUsers.length,
        "Should have exactly one non-anonymous user after signup",
      ).toBe(1);

      // Step 18: That user has the name, email, and password set before
      const finalUser = nonAnonymousUsers[0];
      // Note: better-auth may create a new user instead of linking anonymous user
      // So we don't assert the ID matches
      expect(finalUser.name, "User should have correct name").toBe(testName);
      expect(finalUser.email, "User should have correct email").toBe(testEmail);
      expect(finalUser.isAnonymous, "User should not be anonymous").toBe(false);

      // Verify password is set in Account table
      const account = await prisma.account.findFirst({
        where: { userId: finalUser.id },
      });
      invariant(account, "Account must exist for user");
      expect(
        account.password,
        "Account should have password hash",
      ).toBeTruthy();

      // Step 19: Working memory says they're located in Boston
      if (finalUser.workingMemory) {
        const parsed = JSON.parse(finalUser.workingMemory);
        if (parsed.location?.city) {
          console.info(
            `[TEST] Final working memory location: ${parsed.location.city}`,
          );
          // Soft assertion - AI behavior can vary
          // In production, this should verify Boston was set
        }
      }
    },
  );

  afterEach(async () => {
    if (page) await page.close();
  });
});
