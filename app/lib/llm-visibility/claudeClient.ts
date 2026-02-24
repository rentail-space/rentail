// app/lib/llm-visibility/claudeClient.ts
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { LLMResult } from "./types";

const MODEL_ID = "claude-haiku-4-5-20251001";

export default async function queryClaude(query: string): Promise<LLMResult> {
  const { text } = await generateText({
    model: anthropic(MODEL_ID),
    prompt: query,
    maxOutputTokens: 2000,
  });
  return { text, citations: [] };
}
