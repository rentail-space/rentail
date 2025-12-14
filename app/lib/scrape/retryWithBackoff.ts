import { delay } from "es-toolkit";

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

/**
 * Retry a function with exponential backoff.
 * Specifically handles API overload errors from AI services.
 *
 * @param fn - Function to retry
 * @param options - Retry configuration
 * @returns Result of the function
 */
export default async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 2000,
    maxDelay = 30000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | undefined;
  let currentDelay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if this is a retryable error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isOverloaded =
        errorMessage.includes("Overloaded") ||
        errorMessage.includes("overloaded") ||
        errorMessage.includes("529");

      if (!isOverloaded || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delayMs = Math.min(currentDelay, maxDelay);
      console.warn(
        "\x1b[33m  ⚠ API overloaded, retrying in %dms (attempt %d/%d)\x1b[0m",
        delayMs,
        attempt + 1,
        maxRetries,
      );

      await delay(delayMs);
      currentDelay *= backoffMultiplier;
    }
  }

  throw lastError;
}
