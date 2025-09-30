import { expect, type Page } from "playwright/test";
import { afterEach, beforeEach, describe, it } from "vitest";
import env from "~/lib/env";
import { openPage, URL } from "./helpers/launchBrowser";

describe("Authentication", () => {
  let page: Page;

  beforeEach(async () => {
    page = await openPage(env.isDebug);
  });

  describe("Sign In Page", () => {
    it("renders sign-in form correctly", async () => {
      const response = await page.goto(`${URL}/auth`);
      expect(response?.status(), "should respond with 200").toEqual(200);

      // Check page title
      await expect(page.locator("h1")).toContainText("Welcome Back");

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

      // Start with sign-in
      await expect(page.locator("h1")).toContainText("Welcome Back");

      // Toggle to sign-up
      await page.click("text=Don't have an account? Sign up");
      await expect(page.locator("h1")).toContainText("Create Account");
      await expect(page.locator("input[id*='name']")).toBeVisible();

      // Toggle back to sign-in
      await page.click("text=Already have an account? Sign in");
      await expect(page.locator("h1")).toContainText("Welcome Back");
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
    const testEmail = "existing-user@example.com";
    const testPassword = "ExistingPassword123!";
    const testName = "Existing User";

    // Create a test user before sign-in tests
    beforeEach(async () => {
      // Navigate to auth page and create account
      await page.goto(`${URL}/auth`);
      await page.click("text=Don't have an account? Sign up");

      await page.fill("input[id*='name']", testName);
      await page.fill("input[type='email']", testEmail);
      await page.fill("input[type='password']", testPassword);
      await page.click("button[type='submit']");

      // Wait for redirect
      await page.waitForURL(`${URL}/chat`, { timeout: 5000 });

      // Sign out
      await page.click(`button:has-text("${testName}")`);
      await page.click("text=Sign Out");

      // Wait for redirect to home
      await page.waitForURL(`${URL}/`, { timeout: 5000 });
    });

    it("signs in existing user successfully", async () => {
      await page.goto(`${URL}/auth`);

      // Fill in credentials
      await page.fill("input[type='email']", testEmail);
      await page.fill("input[type='password']", testPassword);

      // Submit the form
      await page.click("button[type='submit']");

      // Wait for redirect to chat page
      await page.waitForURL(`${URL}/chat`, { timeout: 5000 });

      // Verify we're on the chat page
      expect(page.url()).toContain("/chat");

      // Check that header shows user dropdown
      await expect(
        page.locator("button").filter({ hasText: testName }),
      ).toBeVisible();
    });

    it("shows error for incorrect credentials", async () => {
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
    const testEmail = "dropdown-test@example.com";
    const testPassword = "DropdownTest123!";
    const testName = "Dropdown Test User";

    beforeEach(async () => {
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

      // Should see "Sign In" link instead of user dropdown
      await expect(page.locator("a").filter({ hasText: "Sign In" })).toBeVisible();
    });
  });

  describe("Anonymous vs Authenticated Users", () => {
    it("shows sign-in link for anonymous users", async () => {
      await page.goto(`${URL}/`);

      // Should show "Sign In" link for anonymous users
      await expect(page.locator("a").filter({ hasText: "Sign In" })).toBeVisible();
    });

    it("hides export buttons for anonymous users", async () => {
      await page.goto(`${URL}/chat`);

      // Export buttons should not be visible for anonymous users
      await expect(page.locator("a").filter({ hasText: "CSV" })).not.toBeVisible();
      await expect(page.locator("a").filter({ hasText: "PDF" })).not.toBeVisible();
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

  afterEach(async () => {
    if (page) await page.close();
  });
});