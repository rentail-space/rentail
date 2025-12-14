export class RateLimiter {
  private lastCall = 0;
  private minDelay: number;

  constructor(minDelayMs: number) {
    this.minDelay = minDelayMs;
  }

  async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.minDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minDelay - elapsed),
      );
    }
    this.lastCall = Date.now();
  }
}
