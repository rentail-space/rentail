// app/lib/llm-visibility/perplexityClient.ts
import { createPerplexity } from "@ai-sdk/perplexity";
import { generateText } from "ai";
import envVars from "~/lib/env";
import type { LLMResult } from "./types";

const MODEL_ID = "sonar";

export default async function queryPerplexity(
  query: string,
): Promise<LLMResult> {
  if (!envVars.PERPLEXITY_API_KEY)
    throw new Error("PERPLEXITY_API_KEY is not set");

  const perplexity = createPerplexity({
    apiKey: envVars.PERPLEXITY_API_KEY,
  });

  const { text, providerMetadata } = await generateText({
    model: perplexity(MODEL_ID),
    prompt: query,
    maxOutputTokens: 2000,
  });

  const citations =
    (providerMetadata?.perplexity?.citations as string[] | undefined) ?? [];

  return { text, citations };
}
