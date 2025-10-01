import { expect, type Page } from "playwright/test";
import { afterEach, beforeEach, describe, it } from "vitest";
import env from "~/lib/env";
import { openPage, URL } from "./helpers/launchBrowser";

describe.skip("Authentication", () => {
  let page: Page;

  beforeEach(async () => {
    page = await openPage(env.isDebug);
  });

  describe("Sign In Page", () => {
    it("renders sign-in form correctly", async () => {
      const response = await page.goto(`${URL}/auth`);
      expect(response?.status(), "should respond with 200").toEqual(200);

      // Check page title (select h1 with specific class, not the header h1)
      await expect(
        page.locator("h1.text-3xl.font-bold.text-gray-900"),
      ).toContainText("Welcome Back");

      // Check form elements are present
      await expect(page.locator("input[type='email']")).toBeVisible();
      await expect(page.locator("input[type='password']")).toBeVisible();
      await expect(
        page.locator("button[type='submit']").filter({ hasText: "Sign In" }),
      ).toBeVisible();

      // Check toggle to sign up
      await expect(
        page.locator("button").filter({ hasText: "Sign up" }),
      ).toBeVisible();
    });

    it("toggles between sign-in and sign-up modes", async () => {
      await page.goto(`${URL}/auth`);

      // Start with sign-in (select h1 with specific class)
      await expect(
        page.locator("h1.text-3xl.font-bold.text-gray-900"),
      ).toContainText("Welcome Back");

      // Toggle to sign-up
      await page.click("text=Don't have an account? Sign up");
      await expect(
        page.locator("h1.text-3xl.font-bold.text-gray-900"),
      ).toContainText("Create Account");
      // Wait for the name input to appear after state update
      await page.waitForSelector("input[id*='name']", {
        state: "visible",
        timeout: 5000,
      });
      await expect(page.locator("input[id*='name']")).toBeVisible();

      // Toggle back to sign-in
      await page.click("text=Already have an account? Sign in");
      await expect(
        page.locator("h1.text-3xl.font-bold.text-gray-900"),
      ).toContainText("Welcome Back");
      await expect(page.locator("input[id*='name']")).not.toBeVisible();
    });
  });

  describe("Sign Up Flow", () => {
    it("validates required fields", async () => {
      await page.goto(`${URL}/auth`);

      // Switch to sign-up mode
      await page.click("text=Don't have an account? Sign up");

      // Try to submit without filling fields
      await page.click("button[type='submit']");

      // Check that form validation prevents submission
      const nameInput = page.locator("input[id*='name']");
      await expect(nameInput).toHaveAttribute("required", "");

      const emailInput = page.locator("input[type='email']");
      await expect(emailInput).toHaveAttribute("required", "");

      const passwordInput = page.locator("input[type='password']");
      await expect(passwordInput).toHaveAttribute("required", "");
    });

    it("validates password length", async () => {
      await page.goto(`${URL}/auth`);

      // Switch to sign-up mode
      await page.click("text=Don't have an account? Sign up");

      // Check password minimum length
      const passwordInput = page.locator("input[type='password']");
      await expect(passwordInput).toHaveAttribute("minlength", "8");

      // Verify helper text is shown
      await expect(
        page.locator("text=Must be at least 8 characters"),
      ).toBeVisible();
    });

    it("creates new user account successfully", async () => {
      await page.goto(`${URL}/auth`);

      // Switch to sign-up mode
      await page.click("text=Don't have an account? Sign up");

      // Generate unique test user credentials
      const timestamp = Date.now();
      const testEmail = `test-user-${timestamp}@example.com`;
      const testName = `Test User ${timestamp}`;
      const testPassword = "SecurePassword123!";

      // Fill in the form
      await page.fill("input[id*='name']", testName);
      await page.fill("input[type='email']", testEmail);
      await page.fill("input[type='password']", testPassword);

      // Submit the form
      await page.click("button[type='submit']");

      // Wait for redirect to chat page (sign-up auto-signs in)
      await page.waitForURL(`${URL}/chat`, { timeout: 5000 });

      // Verify we're on the chat page
      expect(page.url()).toContain("/chat");

      // Check that header shows user dropdown (authenticated state)
      await expect(
        page.locator("button").filter({ hasText: testName }),
      ).toBeVisible();
    });
  });

  describe("Sign In Flow", () => {
    it("signs in existing user successfully", async () => {
      // Create a unique user for this test
      const timestamp = Date.now();
      const testEmail = `signin-test-${timestamp}@example.com`;
      const testPassword = "SignInTest123!";
      const testName = `Signin User ${timestamp}`;

      // First, create the account
      await page.goto(`${URL}/auth`);
      await page.click("text=Don't have an account? Sign up");

      await page.fill("input[id*='name']", testName);
      await page.fill("input[type='email']", testEmail);
      await page.fill("input[type='password']", testPassword);
      await page.click("button[type='submit']");

      // Wait for redirect to chat
      await page.waitForURL(`${URL}/chat`, { timeout: 10000 });

      // Sign out
      await page.click(`button:has-text("${testName}")`);
      await page.click("text=Sign Out");

      // Wait for redirect to home
      await page.waitForURL(`${URL}/`, { timeout: 10000 });
      await page.waitForLoadState("networkidle");

      // Now test signing back in
      await page.goto(`${URL}/auth`);
      await page.waitForLoadState("domcontentloaded");

      // Wait for auth client to initialize
      await page.waitForTimeout(500);

      // Fill in credentials
      await page.fill("input[type='email']", testEmail);
      await page.fill("input[type='password']", testPassword);

      // Submit the form by clicking the button
      await page.click("button[type='submit']");

      // Wait for redirect to chat page
      await page.waitForURL(`${URL}/chat`, { timeout: 10000 });

      // Verify we're on the chat page
      expect(page.url()).toContain("/chat");

      // Check that header shows user dropdown
      await expect(
        page.locator("button").filter({ hasText: testName }),
      ).toBeVisible();
    });

    it("shows error for incorrect credentials", async () => {
      // Create a user first
      const timestamp = Date.now();
      const testEmail = `error-test-${timestamp}@example.com`;
      const testPassword = "ErrorTest123!";
      const testName = `Error User ${timestamp}`;

      await page.goto(`${URL}/auth`);
      await page.click("text=Don't have an account? Sign up");

      await page.fill("input[id*='name']", testName);
      await page.fill("input[type='email']", testEmail);
      await page.fill("input[type='password']", testPassword);
      await page.click("button[type='submit']");

      await page.waitForURL(`${URL}/chat`, { timeout: 10000 });

      // Sign out
      await page.click(`button:has-text("${testName}")`);
      await page.click("text=Sign Out");
      await page.waitForURL(`${URL}/`, { timeout: 10000 });

      // Now try to sign in with wrong password
      await page.goto(`${URL}/auth`);

      // Fill in incorrect credentials
      await page.fill("input[type='email']", testEmail);
      await page.fill("input[type='password']", "WrongPassword123!");

      // Submit the form
      await page.click("button[type='submit']");

      // Wait for error message
      await expect(
        page.locator(".bg-red-50").filter({ hasText: /failed/i }),
      ).toBeVisible({ timeout: 3000 });

      // Should still be on auth page
      expect(page.url()).toContain("/auth");
    });
  });

  describe("User Dropdown Menu", () => {
    let testEmail: string;
    let testPassword: string;
    let testName: string;

    beforeEach(async () => {
      // Use unique email for each test run
      const timestamp = Date.now();
      testEmail = `dropdown-test-${timestamp}@example.com`;
      testPassword = "DropdownTest123!";
      testName = `Dropdown User ${timestamp}`;

      // Create and sign in a user
      await page.goto(`${URL}/auth`);
      await page.click("text=Don't have an account? Sign up");

      await page.fill("input[id*='name']", testName);
      await page.fill("input[type='email']", testEmail);
      await page.fill("input[type='password']", testPassword);
      await page.click("button[type='submit']");

      await page.waitForURL(`${URL}/chat`, { timeout: 5000 });
    });

    it("displays user dropdown with user info", async () => {
      // Click on user button to open dropdown
      await page.click(`button:has-text("${testName}")`);

      // Check dropdown is visible
      await expect(page.locator(".absolute.right-0")).toBeVisible();

      // Check user name in dropdown
      await expect(
        page.locator(".font-medium").filter({ hasText: testName }),
      ).toBeVisible();

      // Check email in dropdown
      await expect(
        page.locator(".text-xs").filter({ hasText: testEmail }),
      ).toBeVisible();

      // Check sign out button
      await expect(page.locator("text=Sign Out")).toBeVisible();
    });

    it("closes dropdown when clicking outside", async () => {
      // Open dropdown
      await page.click(`button:has-text("${testName}")`);
      await expect(page.locator(".absolute.right-0")).toBeVisible();

      // Click outside (on header)
      await page.click("header");

      // Dropdown should close
      await expect(page.locator(".absolute.right-0")).not.toBeVisible();
    });

    it("signs out user from dropdown", async () => {
      // Open dropdown
      await page.click(`button:has-text("${testName}")`);

      // Click sign out
      await page.click("text=Sign Out");

      // Wait for redirect to home
      await page.waitForURL(`${URL}/`, { timeout: 5000 });

      // Should see "Sign In" link instead of user dropdown (wait for header + hydration)
      await page.waitForSelector("header div.flex", { timeout: 10000 });
      await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible({
        timeout: 10000,
      });
    });
  });

  describe("Anonymous vs Authenticated Users", () => {
    it("shows sign-in link for anonymous users", async () => {
      await page.goto(`${URL}/`);
      await page.waitForLoadState("networkidle");

      // Wait for header to finish loading (isClient becomes true)
      await page.waitForSelector("header div.flex", { timeout: 10000 });

      // Should show "Sign In" link for anonymous users (wait for auth state)
      await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible({
        timeout: 10000,
      });
    });

    it("hides export buttons for anonymous users", async () => {
      await page.goto(`${URL}/chat`);

      // Export buttons should not be visible for anonymous users
      await expect(
        page.locator("a").filter({ hasText: "CSV" }),
      ).not.toBeVisible();
      await expect(
        page.locator("a").filter({ hasText: "PDF" }),
      ).not.toBeVisible();
    });

    it("shows export buttons for authenticated users", async () => {
      // Create and sign in a user
      const timestamp = Date.now();
      await page.goto(`${URL}/auth`);
      await page.click("text=Don't have an account? Sign up");

      await page.fill("input[id*='name']", `Export Test ${timestamp}`);
      await page.fill("input[type='email']", `export-${timestamp}@example.com`);
      await page.fill("input[type='password']", "ExportTest123!");
      await page.click("button[type='submit']");

      await page.waitForURL(`${URL}/chat`, { timeout: 5000 });

      // Send a message to create chat history
      await page.fill("input[type='text']", "Test message");
      await page.press("input[type='text']", "Enter");
      await page.waitForTimeout(1000);

      // Export buttons should be visible for authenticated users with chat
      await expect(page.locator("a").filter({ hasText: "CSV" })).toBeVisible();
      await expect(page.locator("a").filter({ hasText: "PDF" })).toBeVisible();
    });
  });

  describe("Complete User Journey: Chat to Sign Up", () => {
    it("user visits chat, clicks sign in, signs up, and returns to chat authenticated", async () => {
      // Step 1: Visit chat page as anonymous user
      await page.goto(`${URL}/chat`);
      await page.waitForLoadState("networkidle");

      // Verify we're on the chat page
      expect(page.url()).toContain("/chat");

      // Step 2: Wait for header to load then verify "Sign In" button is visible
      await page.waitForSelector("header div.flex", { timeout: 10000 });
      const signInButton = page.getByRole("link", { name: "Sign In" });
      await expect(signInButton).toBeVisible({ timeout: 10000 });

      // Verify export buttons are NOT visible for anonymous users
      await expect(
        page.locator("a").filter({ hasText: "CSV" }),
      ).not.toBeVisible();
      await expect(
        page.locator("a").filter({ hasText: "PDF" }),
      ).not.toBeVisible();

      // Step 3: Click "Sign In" button
      await signInButton.click();

      // Should redirect to auth page
      await page.waitForURL(`${URL}/auth`, { timeout: 5000 });
      expect(page.url()).toContain("/auth");

      // Step 4: Switch to sign-up mode
      await page.click("text=Don't have an account? Sign up");
      await expect(
        page.locator("h1.text-3xl.font-bold.text-gray-900"),
      ).toContainText("Create Account");

      // Step 5: Fill in sign-up form
      const timestamp = Date.now();
      const testEmail = `journey-test-${timestamp}@example.com`;
      const testName = `Journey Test ${timestamp}`;
      const testPassword = "JourneyTest123!";

      await page.fill("input[id*='name']", testName);
      await page.fill("input[type='email']", testEmail);
      await page.fill("input[type='password']", testPassword);

      // Step 6: Submit sign-up form
      await page.click("button[type='submit']");

      // Should redirect back to chat page
      await page.waitForURL(`${URL}/chat`, { timeout: 5000 });
      expect(page.url()).toContain("/chat");

      // Step 7: Verify user is now authenticated
      // Should see user dropdown button with their name
      const userButton = page.locator("button").filter({ hasText: testName });
      await expect(userButton).toBeVisible();

      // Should NOT see "Sign In" link anymore
      await expect(
        page.getByRole("link", { name: "Sign In" }),
      ).not.toBeVisible();

      // Step 8: Open user dropdown
      await userButton.click();

      // Verify dropdown shows user info
      await expect(
        page.locator(".font-medium").filter({ hasText: testName }),
      ).toBeVisible();
      await expect(
        page.locator(".text-xs").filter({ hasText: testEmail }),
      ).toBeVisible();

      // Step 9: Verify "Sign Out" button is in dropdown
      const signOutButton = page.locator("text=Sign Out");
      await expect(signOutButton).toBeVisible();

      // Step 10: Send a message to ensure chat functionality works
      await page.fill("input[type='text']", "Hello, I'm looking for a space");
      await page.press("input[type='text']", "Enter");
      await page.waitForTimeout(1000);

      // Step 11: Verify export buttons are NOW visible for authenticated users
      await expect(page.locator("a").filter({ hasText: "CSV" })).toBeVisible();
      await expect(page.locator("a").filter({ hasText: "PDF" })).toBeVisible();

      // Step 12: Test sign out
      await userButton.click(); // Reopen dropdown if it closed
      await signOutButton.click();

      // Should redirect to home page
      await page.waitForURL(`${URL}/`, { timeout: 5000 });
      expect(page.url()).toBe(`${URL}/`);

      // Step 13: Navigate back to chat and verify anonymous state
      await page.goto(`${URL}/chat`);

      // Should see "Sign In" button again (wait for header + auth state)
      await page.waitForSelector("header div.flex", { timeout: 10000 });
      await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible({
        timeout: 10000,
      });

      // Should NOT see user dropdown
      await expect(
        page.locator("button").filter({ hasText: testName }),
      ).not.toBeVisible();
    });

    it("user visits chat, clicks sign in, signs in with existing account", async () => {
      // First, create an account
      const timestamp = Date.now();
      const testEmail = `existing-journey-${timestamp}@example.com`;
      const testName = `Existing Journey ${timestamp}`;
      const testPassword = "ExistingJourney123!";

      await page.goto(`${URL}/auth`);
      await page.click("text=Don't have an account? Sign up");

      await page.fill("input[id*='name']", testName);
      await page.fill("input[type='email']", testEmail);
      await page.fill("input[type='password']", testPassword);
      await page.click("button[type='submit']");

      await page.waitForURL(`${URL}/chat`, { timeout: 5000 });

      // Sign out
      await page.click(`button:has-text("${testName}")`);
      await page.click("text=Sign Out");
      await page.waitForURL(`${URL}/`, { timeout: 5000 });

      // Now test the journey
      // Step 1: Visit chat as anonymous
      await page.goto(`${URL}/chat`);
      await page.waitForLoadState("networkidle");

      // Step 2: Click sign in
      await page.click("a:has-text('Sign In')");
      await page.waitForURL(`${URL}/auth`, { timeout: 5000 });

      // Step 3: Sign in with existing credentials (already on sign-in form)
      await page.fill("input[type='email']", testEmail);
      await page.fill("input[type='password']", testPassword);
      await page.click("button[type='submit']");

      // Step 4: Should redirect back to chat
      await page.waitForURL(`${URL}/chat`, { timeout: 5000 });

      // Step 5: Verify authenticated state
      await expect(
        page.locator("button").filter({ hasText: testName }),
      ).toBeVisible();

      // Step 6: Open dropdown and verify sign out is available
      await page.click(`button:has-text("${testName}")`);
      await expect(page.locator("text=Sign Out")).toBeVisible();
    });
  });

  afterEach(async () => {
    if (page) await page.close();
  });
});
