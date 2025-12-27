import {
  type AnthropicProviderOptions,
  createAnthropic,
} from "@ai-sdk/anthropic";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
} from "@ai-sdk/provider";
import { wrapLanguageModel } from "ai";
import envVars from "./env";

function addMiddleware(model: LanguageModelV3): LanguageModelV3 {
  return wrapLanguageModel({
    model,
    middleware: envVars.isDevelopment ? [devToolsMiddleware()] : [],
  });
}

/**
 * The smartest model for the conversational tasks (replying to the user).
 */
export const conversational = {
  model: addMiddleware(
    createAnthropic({
      apiKey: envVars.ANTHROPIC_API_KEY,
    })("claude-sonnet-4-5"),
  ),
  providerOptions: { anthropic: {} as AnthropicProviderOptions },
  seed: 42,
  temperature: 0.0,
} satisfies Omit<LanguageModelV3CallOptions, "prompt"> & {
  model: LanguageModelV3;
};

/**
 * The cheapest model for the classification tasks (verifying assistant's response).
 */
export const classify = {
  model: addMiddleware(
    createAnthropic({
      apiKey: envVars.ANTHROPIC_API_KEY,
    })("claude-haiku-4-5"),
  ),
  providerOptions: {
    anthropic: {
      cacheControl: { type: "ephemeral", ttl: "1h" },
    } as AnthropicProviderOptions,
  },
  seed: 42,
  temperature: 0.0,
} satisfies Omit<LanguageModelV3CallOptions, "prompt"> & {
  model: LanguageModelV3;
};
