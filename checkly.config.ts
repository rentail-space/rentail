import { defineConfig } from "checkly";
import { Frequency } from "checkly/constructs";

/**
 * See https://www.checklyhq.com/docs/cli/project-structure/
 */
export default defineConfig({
  logicalId: "rentail",
  projectName: "rentail",
  repoUrl: "https://github.com/rentail-space/rentail",
  checks: {
    ignoreDirectoriesMatch: ["node_modules", "dist", "build"],
    activated: true,
    browserChecks: { testMatch: "__checks__/**/*.spec.ts" },
    checkMatch: "__checks__/**/*.check.ts",
    frequency: Frequency.EVERY_30M,
    locations: ["us-east-1", "eu-west-1"],
    muted: false,
    playwrightConfig: {},
    runtimeId: "2024.09",
    tags: ["rentail"],
  },
  cli: {
    reporters: ["list"],
    retries: 0,
    runLocation: "eu-west-1",
    verbose: true,
  },
});
