import { expect, type Page } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { goto } from "~/test/helpers/launchBrowser";

describe("Home page", () => {
  let page: Page;

  beforeAll(async () => {
    page = await goto("/");
  });

  it("home page", async () => {
    await expect(page).toMatchScreenshot();
  });
});
