import debug from "debug";
import { beforeAll, describe, expect, it } from "vitest";
import prisma from "~/lib/prisma";
import { cleanParseWorkingMemory } from "~/lib/workingMemory";
import runThroughScript from "../helpers/runThroughScript";

const script = `
  Assistant:
  [ ] Welcomes the user

  User: I'm downtown

  Assistant:
  [ ] Asks user to verify their location

  User: Yes, I'm in downtown Los Angeles

  Assistant:
  [ ] Recommends retail spaces in downtown Los Angeles or ask user about their product
`;

const logger = debug("conversations");

describe.runIf(!!process.env.TEST_AI)(
  "User is not in Los Angeles area",
  async () => {
    await runThroughScript({
      headers: {
        // Palm Desert, California
        "x-vercel-ip-latitude": "33.83039",
        "x-vercel-ip-longitude": "-116.54560",
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

      it("should update working memory", async () => {
        expect(workingMemory.location).toMatchObject({
          city: "Los Angeles",
          state: "California",
          country: /(United States|US)/i,
          timeZone: "America/Los_Angeles",
        });
      });

      it("should update longitude and latitude", async () => {
        expect(workingMemory.location?.longitude).toBeCloseTo(-118.242766, 1);
        expect(workingMemory.location?.latitude).toBeCloseTo(34.0536909, 1);
      });
    });
  },
);
