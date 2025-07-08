import { createAnthropic } from "@ai-sdk/anthropic";
import serverConfig from "./config";

const model = createAnthropic({
  apiKey: serverConfig.ANTHROPIC_API_KEY,
})("claude-4-opus-20250514");
console.info("LLM model: %s", model.modelId);

export default model;
