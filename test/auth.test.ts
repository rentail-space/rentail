import { delay } from "es-toolkit";
import { expect, type Page } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import type zod from "zod";
import prisma from "~/lib/prisma";
import { getWorkingMemory, type userProfile } from "~/lib/workingMemory";
import { openPage, URL } from "~/test/helpers/launchBrowser";

describe("Authentication", () => {
  let page: Page;

  beforeAll(async () => {
    page = await openPage();
    await prisma.user.deleteMany();
  });

  describe("anonymous visits chat page", () => {
    beforeAll(async () => {
      await page.goto(`${URL}/chat`);
      // Wait for the chat input to render (this proves page is loaded and React hydrated)
      await page.waitForSelector("input[type='text']");
    });

    it("creates anonymous user when opening chat page", async () => {
      expect(page.url()).toEqual(`${URL}/chat`);
    });

    it("shows sign-in button for unauthenticated users", async () => {
      await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    });

    it("creates anonymous user in database", async () => {
      const users = await prisma.user.findMany();
      expect(users.length, "should have one user").toEqual(1);
      expect(users[0].isAnonymous, "User should be anonymous").toBe(true);
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
      expect(workingMemory.location?.latitude).toEqual("37.42240");
      expect(workingMemory.location?.longitude).toEqual("-122.08421");
      expect(workingMemory.location?.timeZone).toEqual("America/Los_Angeles");
    });

    describe("updates their location", () => {
      let workingMemory: zod.infer<typeof userProfile>;

      beforeAll(async () => {
        const input = page.locator("input[type='text']").first();
        await input.focus();
        await input.pressSequentially("Actually I'm in Boston");
        await input.press("Enter");

        while (!workingMemory) {
          await delay(100);
          const chat = await prisma.chat.findFirstOrThrow({
            include: { messages: true, user: true },
            where: { user: { isAnonymous: true } },
          });
          console.log("**** chat.messages.length", chat.messages.length);
          if (chat.messages.length === 3)
            workingMemory = await getWorkingMemory(chat);
        }

        console.log("**** workingMemory", workingMemory);
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

      describe("visits sign-in page", () => {
        beforeAll(async () => {
          await page.getByRole("button", { name: "Sign In" }).click();
          await page.waitForURL(`${URL}/auth`, { waitUntil: "load" });
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
            page.getByRole("button", {
              name: "Don't have an account? Sign up",
            }),
          ).toBeVisible();
        });

        describe("visits sign-up page", () => {
          beforeAll(async () => {
            await page
              .getByRole("button", { name: "Don't have an account? Sign up" })
              .click();
          });

          it("shows sign-up page", async () => {
            await expect(
              page.getByRole("heading", { name: "Create Account" }),
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
              page.getByRole("button", { name: "Create Account" }),
            ).toBeVisible();
          });

          // biome-ignore lint/complexity/noExcessiveNestedTestSuites: this is a nested test suite
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
              await page
                .getByRole("button", { name: "Create Account" })
                .click();
              await page.waitForURL(`${URL}/chat`, { waitUntil: "load" });
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
              expect(workingMemory.location?.latitude).toEqual("42.3601");
              expect(workingMemory.location?.longitude).toEqual("-71.0589");
              expect(workingMemory.location?.timeZone).toEqual(
                "America/New_York",
              );
            });
          });
        });
      });
    });
  });

  afterAll(async () => {
    if (page) await page.close();
  });
});
