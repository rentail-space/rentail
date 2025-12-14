import { describe, it } from "vitest";
import discoverCenters from "~/lib/scrape/discoverCenters";

describe("debug discoverCenters", () => {
  it("logs the actual error", async () => {
    try {
      const result = await discoverCenters("Los Angeles County, CA");
      console.log("Success! Result:", JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("Error details:", error);
      if (error instanceof Error) {
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("Cause:", error.cause);
        if (error.cause && error.cause instanceof Error) {
          console.error("Cause message:", error.cause.message);
          console.error("Cause stack:", error.cause.stack);
        }
      }
      throw error;
    }
  });
});
