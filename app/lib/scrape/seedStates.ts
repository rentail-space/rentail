import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import z from "zod";
import prisma from "~/lib/prisma";

export default async function seedStates() {
  const stateSchema = z.array(
    z.object({
      name: z.string(),
      abbreviation: z.string(),
      lede: z.string(),
    }),
  );
  const states = await readFile(resolve("prisma/seed/states.json"), "utf-8");
  const statesData = stateSchema.parse(JSON.parse(states));
  for (const state of statesData) {
    await prisma.state.upsert({
      where: { abbreviation: state.abbreviation },
      update: state,
      create: state,
    });
  }
}
