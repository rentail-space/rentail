import debug from "debug";
import { beforeAll, describe, expect, it } from "vitest";
import prisma from "~/lib/prisma";
import { cleanParseWorkingMemory } from "~/lib/workingMemory";
import runThroughScript from "../helpers/runThroughScript";

const script = `
  Assistant:
  [ ] Welcomes the user
  [ ] Introduces Rentail
  [ ] States they're a virtual assistant
  [ ] Offers to help the user
  [ ] Finishes with a question

  User: Tell me all the shopping centers you know about

  Assistant:
  [ ] Lists shopping centers in Southern California
  [ ] Lists more 10 or more shopping centers

  User: looking for pop up shops in Oakville, Ontario

  Assistant:
  [ ] Tells user we don't have centers in Oakville
  [ ] Offers user help exploring spaces in Southern California
  `;

const logger = debug("conversations");

describe.runIf(!!process.env.TEST_AI)(
  "User is not in Los Angeles area",
  async () => {
    await runThroughScript({
      headers: {
        "x-vercel-ip-latitude": "47.608013",
        "x-vercel-ip-longitude": "-122.335167",
        "x-vercel-ip-city": "Seattle",
        "x-vercel-ip-state": "Washington",
        "x-vercel-ip-country": "United States",
        "x-vercel-ip-timezone": "America/Los_Angeles",
      },
      script,
    });

    describe("user records", () => {
      let workingMemory: ReturnType<typeof cleanParseWorkingMemory>;

      beforeAll(async () => {
        const user = await prisma.user.findFirstOrThrow();
        workingMemory = cleanParseWorkingMemory(user?.workingMemory);
        logger(workingMemory.location);
      });

      it("should store user's location in working memory", async () => {
        expect(workingMemory.location).toMatchObject({
          city: "Oakville",
          state: "Ontario",
          country: "Canada",
          timeZone: "America/Toronto",
        });
      });

      it("should store user's geocode in working memory", async () => {
        expect(workingMemory.location?.longitude).toBeCloseTo(-79.547138, 5);
        expect(workingMemory.location?.latitude).toBeCloseTo(43.256693, 5);
      });
    });
  },
);
