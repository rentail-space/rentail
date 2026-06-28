import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
} from "@ai-sdk/provider";
import { wrapLanguageModel } from "ai";
import envVars from "./env";

import { createDeepSeek } from "@ai-sdk/deepseek";

const deepseek = createDeepSeek({
  apiKey: envVars.DEEPSEEK_API_KEY ?? "test-api-key",
});

function addMiddleware(model: LanguageModelV4): LanguageModelV4 {
  return wrapLanguageModel({
    model,
    middleware: [],
  });
}

/**
 * The smartest model for the conversational tasks (replying to the user).
 */
export const conversational = {
  model: addMiddleware(deepseek("deepseek-chat")),
  providerOptions: { openai: {} },
  temperature: 0.0,
} satisfies Omit<LanguageModelV4CallOptions, "prompt"> & {
  model: LanguageModelV4;
};

/**
 * The cheapest model for the classification tasks (verifying assistant's response).
 */
export const classify = {
  model: addMiddleware(deepseek("deepseek-chat")),
  providerOptions: { openai: {} },
  temperature: 0.0,
} satisfies Omit<LanguageModelV4CallOptions, "prompt"> & {
  model: LanguageModelV4;
};
