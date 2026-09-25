import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
} from "@ai-sdk/provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { wrapLanguageModel } from "ai";
import envVars from "./env";

const zai = createOpenAICompatible({
  name: "zai",
  baseURL: "https://api.z.ai/api/paas/v4/",
  apiKey: envVars.ZAI_API_KEY ?? "test-api-key",
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
  model: addMiddleware(zai("glm-5.3-flash")),
  providerOptions: { zai: {} },
  temperature: 0.0,
} satisfies Omit<LanguageModelV4CallOptions, "prompt"> & {
  model: LanguageModelV4;
};

/**
 * The cheapest model for the classification tasks (verifying assistant's response).
 */
export const classify = {
  model: addMiddleware(zai("glm-5.3-flash")),
  providerOptions: { zai: {} },
  temperature: 0.0,
} satisfies Omit<LanguageModelV4CallOptions, "prompt"> & {
  model: LanguageModelV4;
};
