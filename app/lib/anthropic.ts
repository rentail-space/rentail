import { createAnthropic } from "@ai-sdk/anthropic";
import env from "env-var";

const anthropic = createAnthropic({
  apiKey: env.get("ANTHROPIC_API_KEY").required().asString(),
});
const model = anthropic("claude-opus-4-20250514");

export default model;
