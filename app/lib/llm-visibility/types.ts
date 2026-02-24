// app/lib/llm-visibility/types.ts
export type LLMResult = {
  text: string;
  citations: string[]; // empty array for Claude/Gemini
};
