import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { promisify } from "node:util";
import { afterAll, describe, expect, it } from "vitest";

const execAsync = promisify(exec);

describe("collectCenters integration", () => {
  afterAll(async () => {
    await rm("prisma/seed/ca/santa-barbara", {
      recursive: true,
      force: true,
    });
  });

  it.skip("collects centers for a small county end-to-end", async () => {
    // Skipped: requires real API calls and takes 2-3 minutes
    // Manual test: DEBUG=collect:centers tsx scripts/collectCenters.ts "Santa Barbara County, CA"
    const { stdout, stderr } = await execAsync(
      'tsx scripts/collectCenters.ts "Santa Barbara County, CA"',
      { timeout: 180000 }, // 3 minute timeout
    );

    expect(stderr).toBe("");
    expect(stdout).toContain("✓ Processed:");
    expect(stdout).toContain("Centers saved:");

    // Verify at least one file was created
    const hasCenters = existsSync("prisma/seed/ca/santa-barbara");
    expect(hasCenters).toBe(true);
  }, 180000);
});
