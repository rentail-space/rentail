import { type Page, expect } from "playwright/test";
import type { User } from "prisma/generated/client";
import { afterAll, beforeAll, describe, it } from "vitest";
import prisma from "~/lib/prisma";
import converse from "./helpers/converse";
import { goto } from "./helpers/launchBrowser";

describe("UTM parameter capture", () => {
  let page: Page;
  let users: User[];

  beforeAll(async () => {
    // NOTE: visit home page with UTM parameters, here we capture the UTM
    // parameters, then trigger a conversation where we create the user.
    const qs = new URLSearchParams({
      utm_source: "magic",
      utm_medium: "email",
      utm_campaign: "spring2024",
    });
    page = await goto(`/?${qs.toString()}`);
    await converse("Hello, I'm interested in retail spaces");
    users = await prisma.user.findMany();
  });

  it("creates an anonymous user in the database", async () => {
    expect(users.length, "should have one user").toEqual(1);
    expect(users[0].isAnonymous, "user should be anonymous").toBe(true);
  });

  it("stores UTM source in user record", async () => {
    const user = users[0];
    expect(user.utm).toBeDefined();
    const utm = typeof user.utm === "string" ? JSON.parse(user.utm) : user.utm;
    expect(utm.source).toEqual("magic");
  });

  it("stores UTM medium in user record", async () => {
    const user = users[0];
    const utm = typeof user.utm === "string" ? JSON.parse(user.utm) : user.utm;
    expect(utm.medium).toEqual("email");
  });

  it("stores UTM campaign in user record", async () => {
    const user = users[0];
    const utm = typeof user.utm === "string" ? JSON.parse(user.utm) : user.utm;
    expect(utm.campaign).toEqual("spring2024");
  });

  afterAll(async () => {
    await page.close();
  });
});
