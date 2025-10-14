import { expect, type Page } from "playwright/test";
import { beforeAll, describe, it } from "vitest";
import type zod from "zod";
import prisma from "~/lib/prisma";
import type { userProfile } from "~/lib/userProfile";
import { getWorkingMemory } from "~/lib/workingMemory";
import { goto } from "~/test/helpers/launchBrowser";

describe("Anonymous visits chat page", () => {
  let page: Page;

  beforeAll(async () => {
    await prisma.user.deleteMany();
    page = await goto("/chat", {
      "x-forwarded-for": "146.70.195.182",
      "x-vercel-ip-city": "Los Angeles",
      "x-vercel-ip-country": "United States",
      "x-vercel-ip-country-region": "California",
      "x-vercel-ip-timezone": "America/Los_Angeles",
      "x-vercel-ip-latitude": "37.42240",
      "x-vercel-ip-longitude": "-122.08421",
    });
  });

  it("loads chat page and shows sign-in button", async () => {
    await expect(page.locator("input[type='text']")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  it("creates anonymous user in database", async () => {
    const users = await prisma.user.findMany();
    expect(users.length, "should have one user").toEqual(1);
    expect(users[0].isAnonymous, "user should be anonymous").toBe(true);
  });

  it("maintains cookies across requests", async () => {
    const initialCookies = await page.context().cookies();
    expect(initialCookies.length, "Should have cookies").toEqual(2);
  });

  it("sets initial working memory with default location", async () => {
    const chat = await prisma.chat.findFirstOrThrow({
      include: { user: true },
    });
    const workingMemory = await getWorkingMemory(chat);
    expect(workingMemory.location?.city).toEqual("Los Angeles");
    expect(workingMemory.location?.state).toEqual("California");
    expect(workingMemory.location?.country).toEqual("United States");
    expect(workingMemory.location?.latitude).toEqual(37.4224);
    expect(workingMemory.location?.longitude).toEqual(-122.08421);
    expect(workingMemory.location?.timeZone).toEqual("America/Los_Angeles");
  });

  describe("updates their location", () => {
    let workingMemory: zod.infer<typeof userProfile>;

    beforeAll(async () => {
      const input = page.locator("input[type='text']");
      // Clear and type the message properly
      await input.click(); // Focus the input
      await input.fill("Actually I'm in Boston");

      // Submit by pressing Enter (more reliable than clicking button)
      await input.press("Enter");
      await page.waitForLoadState("networkidle");

      await expect(
        page.locator(".chat-bubble").filter({
          hasText: /updated your location to Boston/i,
        }),
      ).toBeVisible();

      const chat = await prisma.chat.findFirstOrThrow({
        include: { messages: true, user: true },
        where: { user: { isAnonymous: true } },
      });
      workingMemory = await getWorkingMemory(chat);
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
      expect(workingMemory.location?.latitude).toEqual(42.3601);
    });

    it("should have user's new longitude", async () => {
      expect(workingMemory.location?.longitude).toEqual(-71.0589);
    });

    it("should have user's new time zone", async () => {
      expect(workingMemory.location?.timeZone).toEqual("America/New_York");
    });

    describe("visits sign-in page", () => {
      beforeAll(async () => {
        await page.getByRole("button", { name: "Sign In" }).click();
        await page.waitForURL("/auth", { waitUntil: "load" });
      });

      it("shows sign-in page", async () => {
        expect(page.url()).toContain("/auth");
        await expect(
          page.getByRole("heading", { name: "Welcome Back" }),
        ).toBeVisible();
      });

      it("shows sign-in page with email field", async () => {
        await expect(
          page.getByRole("textbox", { name: "Email" }),
        ).toBeVisible();
      });

      it("shows sign-in page with password fields", async () => {
        await expect(
          page.getByRole("textbox", { name: "Password" }),
        ).toBeVisible();
      });

      it("shows sign-in page with sign-in button", async () => {
        await expect(
          page.getByRole("button", { name: "Sign In" }),
        ).toBeVisible();
      });

      it("shows sign-in page with sign-up link", async () => {
        await expect(
          page.getByRole("button", { name: /Create one/ }),
        ).toBeVisible();
      });

      describe("visits sign-up page", () => {
        beforeAll(async () => {
          await page.getByRole("button", { name: /Create one/ }).click();
          await page
            .getByRole("heading", { name: /Create Account/ })
            .waitFor({ state: "visible" });
        });

        it("shows sign-up page", async () => {
          await expect(
            page.getByRole("heading", { name: /Create Account/ }),
          ).toBeVisible();
        });

        it("shows sign-up page with name field", async () => {
          await expect(
            page.getByRole("textbox", { name: "Name" }),
          ).toBeVisible();
        });

        it("shows sign-up page with email field", async () => {
          await expect(
            page.getByRole("textbox", { name: "Email" }),
          ).toBeVisible();
        });

        it("shows sign-up page with password fields", async () => {
          await expect(
            page.getByRole("textbox", { name: "Password" }),
          ).toBeVisible();
        });

        it("shows sign-up page with sign-up button", async () => {
          await expect(
            page.getByRole("button", { name: "Create" }),
          ).toBeVisible();
        });

        describe("signs up", () => {
          beforeAll(async () => {
            await page
              .getByRole("textbox", { name: "Name" })
              .fill("Working Memory User");
            await page
              .getByRole("textbox", { name: "Email" })
              .fill("working-memory@example.com");
            await page
              .getByRole("textbox", { name: "Password" })
              .fill("WorkingMemory123!");
            await page.getByRole("button", { name: "Create" }).click();
            await page.waitForURL("/chat", { waitUntil: "load" });
          });

          it("redirects to chat page after successful sign-up", async () => {
            expect(page.url()).toContain("/chat");
          });

          it("shows user dropdown after successful sign-up", async () => {
            await expect(
              page.getByRole("button", { name: "Working Memory User" }),
            ).toBeVisible();
          });

          it("should convert anonymous user to authenticated user", async () => {
            const users = await prisma.user.findMany();
            expect(users.length, "Should have one user").toEqual(1);
            expect(
              users[0].isAnonymous,
              "User should not be anonymous",
            ).toEqual(false);
          });

          it("stores user credentials correctly in database", async () => {
            const user = await prisma.user.findFirstOrThrow({
              where: { isAnonymous: false },
            });
            expect(user.name, "User should have correct name").toEqual(
              "Working Memory User",
            );
            expect(user.email, "User should have correct email").toEqual(
              "working-memory@example.com",
            );
          });

          it("preserves working memory through authentication", async () => {
            const chat = await prisma.chat.findFirstOrThrow({
              include: { user: true },
              where: { user: { isAnonymous: false } },
            });
            const workingMemory = await getWorkingMemory(chat);
            expect(workingMemory.location?.city).toEqual("Boston");
            expect(workingMemory.location?.state).toEqual("Massachusetts");
            expect(workingMemory.location?.country).toEqual("United States");
            expect(workingMemory.location?.latitude).toEqual(42.3601);
            expect(workingMemory.location?.longitude).toEqual(-71.0589);
            expect(workingMemory.location?.timeZone).toEqual(
              "America/New_York",
            );
          });
        });
      });
    });
  });
});
