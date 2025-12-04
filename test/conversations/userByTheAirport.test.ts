import debug from "debug";
import { describe, expect, it } from "vitest";
import prisma from "~/lib/prisma";
import { cleanParseWorkingMemory } from "~/lib/workingMemory";
import runThroughScript from "../helpers/runThroughScript";

const script = `Assistant:
[ ] Welcomes the user

User: I'm by the airport

Assistant:
[ ] Ask user if they are by LAX

User: the other airport

Assistant:
[ ] Asks the user if they are or confirms the user is at Burbank airport

User: burbank

Assistant:
[ ] Recommends shopping centers near Burbank
  `;

const logger = debug("conversations");

describe.runIf(!process.env.CI)("User is not in Los Angeles area", async () => {
  await runThroughScript({
    headers: {
      "x-vercel-ip-latitude": "34.04209",
      "x-vercel-ip-longitude": "-118.25578",
    },
    script,
  });

  it("should update working memory", async () => {
    const user = await prisma.user.findFirst();
    const workingMemory = cleanParseWorkingMemory(user?.workingMemory);
    logger(workingMemory.location);
    expect(workingMemory.location).toMatchObject({
      city: /(Burbank|Los Angeles)/i,
      state: "California",
      country: "United States",
      timeZone: "America/Los_Angeles",
    });
  });

  it("should update user's geocode", async () => {
    const user = await prisma.user.findFirst();
    const workingMemory = cleanParseWorkingMemory(user?.workingMemory);
    expect(workingMemory.location?.longitude).toBeCloseTo(-118.307201, 0);
    expect(workingMemory.location?.latitude).toBeCloseTo(34.1812089, 0);
  });
});
