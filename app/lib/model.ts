import { createAnthropic } from "@ai-sdk/anthropic";
import env from "./env";

/**
 * The smartest model for the conversational tasks (replying to the user).
 */
export const conversationalModel = createAnthropic({
  apiKey: env.ANTHROPIC_API_KEY,
})("claude-opus-4-5");

/**
 * The cheapest model for the classification tasks (verifying assistant's response).
 * Note: Cache middleware is disabled for classify model to avoid conflicts with
 * generateObject calls (cache doesn't distinguish between text and structured generation).
 */
export const classifyModel = createAnthropic({
  apiKey: env.ANTHROPIC_API_KEY,
})("claude-haiku-4-5");
