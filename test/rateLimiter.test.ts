import { describe, expect, it } from "vitest";
import { RateLimiter } from "~/lib/rateLimiter";

describe("RateLimiter", () => {
  it("enforces minimum delay between calls", async () => {
    const limiter = new RateLimiter(100); // 100ms delay
    const start = Date.now();

    await limiter.throttle();
    await limiter.throttle();

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });
});
