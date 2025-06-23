import { createAnthropic } from "@ai-sdk/anthropic";
import "dotenv/config";
import env from "env-var";

export default createAnthropic({
  apiKey: env.get("ANTHROPIC_API_KEY").required().asString(),
})("claude-4-opus-20250514");
