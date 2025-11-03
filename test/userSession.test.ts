import { expect, type Page } from "playwright/test";
import { beforeAll, describe, it } from "vitest";
import type zod from "zod";
import prisma from "~/lib/prisma";
import type { userProfile } from "~/lib/userProfile";
import { cleanParse } from "~/lib/userProfile";
import { goto } from "~/test/helpers/launchBrowser";
import converse from "./helpers/converse";

describe("Anonymous visits chat page", () => {
  let page: Page;

  beforeAll(async () => {
    page = await goto("/chat", {
      "x-forwarded-for": "146.70.195.182",
      "x-vercel-ip-city": "Los Angeles",
      "x-vercel-ip-country": "United States",
      "x-vercel-ip-country-region": "California",
      "x-vercel-ip-timezone": "America/Los_Angeles",
      "x-vercel-ip-latitude": "37.42240",
      "x-vercel-ip-longitude": "-122.08421",
    });

    await converse(page, "Hello, how are you?");
  }, 10_000);

  it("loads chat page and shows sign-in button", async () => {
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  it("should be registered as anonymous user", async () => {
    const users = await prisma.user.findMany();
    expect(users.length, "should have one user").toEqual(1);
    expect(users[0].isAnonymous, "user should be anonymous").toBe(true);
  });

  it("sets initial working memory with default location", async () => {
    const user = await prisma.user.findFirstOrThrow();
    const workingMemory = cleanParse(user.workingMemory);
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
      await converse(page, "Actually I'm in Boston");

      const user = await prisma.user.findFirstOrThrow();
      workingMemory = cleanParse(user.workingMemory);
    });

    it("should show user message in chat", async () => {
      await expect(
        page.locator(".chat-bubble-user", {
          hasText: "Actually I'm in Boston",
        }),
      ).toBeVisible();
    });

    it("should show assistant message in chat", async () => {
      await expect(
        page.locator(".chat-bubble-response", {
          hasText: /Thanks for letting me know/i,
        }),
      ).toBeVisible();
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
              page.locator("button[aria-label='User menu']", {
                hasText: "Working Memory User",
              }),
            ).toBeVisible({ timeout: 5000 });
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
            const user = await prisma.user.findFirstOrThrow({
              where: { isAnonymous: false },
            });
            const workingMemory = cleanParse(user.workingMemory);
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
