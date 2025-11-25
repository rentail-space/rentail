import { describe } from "vitest";
import runThroughScript from "./runThroughScript";

describe("User is not in Los Angeles area", async () => {
  await runThroughScript({
    filename: "./notLA.md",
    headers: {
      "x-vercel-ip-latitude": "47.608013",
      "x-vercel-ip-longitude": "-122.335167",
      "x-vercel-ip-city": "Seattle",
      "x-vercel-ip-state": "Washington",
      "x-vercel-ip-country": "United States",
    },
  });
});
