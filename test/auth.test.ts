import { delay, withTimeout } from "es-toolkit";
import { expect, type Page } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import type zod from "zod";
import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { getWorkingMemory, type userProfile } from "~/lib/workingMemory";
import { openPage, URL } from "./helpers/launchBrowser";

describe("Authentication with Working Memory", () => {
  let page: Page;

  beforeAll(async () => {
    page = await openPage(env.isDebug);
    await prisma.user.deleteMany();
  });

  describe("user visits chat page", () => {
    beforeAll(async () => {
      await page.goto(`${URL}/chat`, { waitUntil: "domcontentloaded" });
    });

    it("creates anonymous user when opening chat page", async () => {
      expect(page.url()).toContain("/chat");
    });

    it("shows sign-in button for unauthenticated users", async () => {
      const signInButton = page.getByRole("button", { name: "Sign In" });
      await expect(signInButton).toBeVisible();
    });

    it("creates anonymous user in database", async () => {
      const users = await prisma.user.findMany();
      expect(users.length, "should have one user").toEqual(1);

      const user = users[0];
      expect(user.isAnonymous, "User should be anonymous").toBe(true);
    });

    it("maintains cookies across requests", async () => {
      const initialCookies = await page.context().cookies();
      expect(initialCookies.length, "Should have cookies").toBeGreaterThan(0);
    });

    it("sets initial working memory with default location", async () => {
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      const workingMemory = await getWorkingMemory(chat);
      expect(workingMemory.location?.city).toEqual("Los Angeles");
      expect(workingMemory.location?.state).toEqual("California");
      expect(workingMemory.location?.country).toEqual("United States");
      expect(workingMemory.location?.latitude).toEqual("37.42240");
      expect(workingMemory.location?.longitude).toEqual("-122.08421");
      expect(workingMemory.location?.timeZone).toEqual("America/Los_Angeles");
    });

    describe("user updates their location", () => {
      let workingMemory: zod.infer<typeof userProfile>;

      beforeAll(async () => {
        const input = page.locator("input[type='text']").first();
        await input.focus();
        await input.pressSequentially("Actually I'm in Boston");
        await page.locator("button[type='submit']").first().click();

        const chat = await prisma.chat.findFirstOrThrow({
          include: { user: true },
        });
        workingMemory = await withTimeout<zod.infer<typeof userProfile>>(
          async () => {
            while (true) {
              const workingMemory = await getWorkingMemory(chat);
              if (workingMemory.location?.city === "Boston")
                return workingMemory;
              else await delay(100);
            }
          },
          10000,
        );
      });

      it("should have user's new city", async () => {
        expect(workingMemory.location?.city).toEqual("Boston");
      });

      it("should have user's new state", async () => {
        expect(workingMemory.location?.state).toEqual("Massachusetts");
      });

      it("should have user country", async () => {
        expect(workingMemory.location?.country).toEqual("United States");
      });

      it("should have user's new latitude", async () => {
        expect(workingMemory.location?.latitude).toEqual("42.3601");
      });

      it("should have user's new longitude", async () => {
        expect(workingMemory.location?.longitude).toEqual("-71.0589");
      });

      it("should have user's new time zone", async () => {
        expect(workingMemory.location?.timeZone).toEqual("America/New_York");
      });
    });

    describe("sign-in page", () => {
      beforeAll(async () => {
        await page.goto(`${URL}/chat`, { waitUntil: "domcontentloaded" });
        await page.locator("button", { hasText: "Sign In" }).click();
        await page.waitForURL(`${URL}/auth`);
      });

      it("shows sign-in page", async () => {
        expect(page.url()).toContain("/auth");
        await expect(page.locator("h1")).toContainText("Welcome Back");
      });

      it("shows sign-in page with email field", async () => {
        await expect(page.locator("input[type='email']")).toBeVisible();
      });

      it("shows sign-in page with password fields", async () => {
        await expect(page.locator("input[type='password']")).toBeVisible();
      });

      it("shows sign-in page with sign-in button", async () => {
        await expect(page.locator("button[type='submit']")).toBeVisible();
      });

      it("shows sign-in page with sign-up link", async () => {
        await expect(
          page.locator("text=Don't have an account? Sign up"),
        ).toBeVisible();
      });

      describe("sign-up page", () => {
        beforeAll(async () => {
          await page.locator("button", { hasText: /Sign up/i }).click();
        });

        it("shows sign-up page", async () => {
          await expect(page.locator("h1")).toContainText("Create Account");
        });

        it("shows sign-up page with name field", async () => {
          await expect(page.locator("input[id*='name']")).toBeVisible();
        });

        it("shows sign-up page with email field", async () => {
          await expect(page.locator("input[type='email']")).toBeVisible();
        });

        it("shows sign-up page with password fields", async () => {
          await expect(page.locator("input[type='password']")).toBeVisible();
        });

        it("shows sign-up page with sign-up button", async () => {
          await expect(page.locator("button[type='submit']")).toBeVisible();
        });

        describe("user signs up", () => {
          beforeAll(async () => {
            await page.locator("input[id*='name']").fill("Working Memory User");
            await page
              .locator("input[type='email']")
              .fill("working-memory@example.com");
            await page
              .locator("input[type='password']")
              .fill("WorkingMemory123!");
            await page.locator("button[type='submit']").click();
            await page.waitForURL(`${URL}/chat`);
          });

          it("redirects to chat page after successful sign-up", async () => {
            expect(page.url()).toContain("/chat");
          });

          it("shows user dropdown after successful sign-up", async () => {
            await expect(
              page.locator("button").filter({ hasText: "Working Memory User" }),
            ).toBeVisible();
          });

          it("displays user info in dropdown menu", async () => {
            await expect(
              page.locator("button").filter({ hasText: "Working Memory User" }),
            ).toBeVisible();
          });

          it("stores user credentials correctly in database", async () => {
            const users = await prisma.user.findMany();
            console.log("\n\nusers", users);
            expect(users.length, "Should have exactly one user").toBe(1);
            const user = users[0];
            expect(user.name, "User should have correct name").toBe(
              "Working Memory User",
            );
            expect(user.email, "User should have correct email").toBe(
              "working-memory@example.com",
            );
          });

          it("preserves working memory through authentication", async () => {
            const chat = await prisma.chat.findFirstOrThrow({
              include: { user: true },
            });
            const workingMemory = await getWorkingMemory(chat);
            console.log("\n\nworkingMemory", workingMemory);
            expect(workingMemory.location?.city).toEqual("Boston");
          });
        });
      });
    });
  });

  afterAll(async () => {
    if (page) await page.close();
  });
});
