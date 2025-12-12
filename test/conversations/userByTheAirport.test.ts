import debug from "debug";
import { beforeAll, describe, expect, it } from "vitest";
import prisma from "~/lib/prisma";
import { cleanParseWorkingMemory } from "~/lib/workingMemory";
import runThroughScript from "~/test/helpers/runThroughScript";

const script = `
  Assistant:
  [ ] Welcomes the user

  User: I'm by the airport

  Assistant:
  [ ] Ask user if they are by LAX

  User: the other airport

  Assistant:
  [ ] Asks the user if they are near Burbank Airport or confirms the user is near Burbank airport

  User: burbank

  Assistant:
  [ ] Recommends shopping centers near Burbank or ask the user what product they're selling
  `;

const logger = debug("conversations");

describe.skipIf(!!process.env.CI)(
  "User is not in Los Angeles area",
  async () => {
    await runThroughScript({
      headers: {
        "x-real-ip": "127.0.0.1",
        "x-vercel-ip-city": "Los Angeles",
        "x-vercel-ip-latitude": "34.04209",
        "x-vercel-ip-longitude": "-118.25578",
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
          city: /(Burbank|Los Angeles)/i,
          state: "California",
          country: /(United States|US)/i,
          timeZone: "America/Los_Angeles",
        });
      });

      it("should update user's geocode", async () => {
        expect(workingMemory.location?.longitude).toBeCloseTo(-118.307201, 0);
        expect(workingMemory.location?.latitude).toBeCloseTo(34.1812089, 0);
      });
    });
  },
);
