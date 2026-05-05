import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
} from "@ai-sdk/provider";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { wrapLanguageModel } from "ai";
import envVars from "./env";

import { createDeepSeek } from "@ai-sdk/deepseek";

const deepseek = createDeepSeek({
  apiKey: envVars.DEEPSEEK_API_KEY ?? "test-api-key",
});

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
  model: addMiddleware(deepseek("deepseek-chat")),
  providerOptions: { openai: {} },
  temperature: 0.0,
} satisfies Omit<LanguageModelV3CallOptions, "prompt"> & {
  model: LanguageModelV3;
};

/**
 * The cheapest model for the classification tasks (verifying assistant's response).
 */
export const classify = {
  model: addMiddleware(deepseek("deepseek-chat")),
  providerOptions: { openai: {} },
  temperature: 0.0,
} satisfies Omit<LanguageModelV3CallOptions, "prompt"> & {
  model: LanguageModelV3;
};
