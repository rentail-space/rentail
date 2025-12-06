import {
  type AnthropicProviderOptions,
  createAnthropic,
} from "@ai-sdk/anthropic";
import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
} from "@ai-sdk/provider";
import env from "./env";

/**
 * The smartest model for the conversational tasks (replying to the user).
 */

export const conversational = {
  model: createAnthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  })("claude-sonnet-4-5"),
  providerOptions: {
    anthropic: {} satisfies AnthropicProviderOptions,
  },
  temperature: 0.0,
} satisfies Omit<LanguageModelV2CallOptions, "prompt"> & {
  model: LanguageModelV2;
};

/**
 * The cheapest model for the classification tasks (verifying assistant's response).
 */
export const classify = {
  model: createAnthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  })("claude-haiku-4-5"),
  providerOptions: {
    anthropic: {
      cacheControl: { type: "ephemeral", ttl: "1h" },
    } satisfies AnthropicProviderOptions,
  },
  temperature: 0.0,
} satisfies Omit<LanguageModelV2CallOptions, "prompt"> & {
  model: LanguageModelV2;
};
