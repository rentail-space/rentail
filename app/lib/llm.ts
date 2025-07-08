import { createAnthropic } from "@ai-sdk/anthropic";
import env from "env-var";

const model = createAnthropic({
  apiKey: env.get("ANTHROPIC_API_KEY").required().asString(),
})("claude-4-opus-20250514");
console.info("LLM model: %s", model.modelId);

export default model;
