import { describe } from "vitest";
import notLA from "./notLA.md?raw";
import runThroughScript from "./runThroughScript";

describe("User is not in Los Angeles area", async (test) => {
  await runThroughScript({
    headers: {
      "x-vercel-ip-latitude": "47.608013",
      "x-vercel-ip-longitude": "-122.335167",
      "x-vercel-ip-city": "Seattle",
      "x-vercel-ip-state": "Washington",
      "x-vercel-ip-country": "United States",
    },
    script: notLA,
    test,
  });
});
