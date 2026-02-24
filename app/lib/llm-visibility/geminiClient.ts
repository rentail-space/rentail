// app/lib/llm-visibility/geminiClient.ts
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { LLMResult } from "./types";

const MODEL_ID = "gemini-2.0-flash";

export default async function queryGemini(query: string): Promise<LLMResult> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");

  const { text } = await generateText({
    model: google(MODEL_ID),
    prompt: query,
    maxOutputTokens: 2000,
  });
  return { text, citations: [] };
}
