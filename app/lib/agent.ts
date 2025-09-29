import { createAnthropic } from "@ai-sdk/anthropic";
import { Agent } from "@mastra/core/agent";
import { ConsoleLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core/mastra";
import { ulid } from "ulid";
import env from "~/lib/env";
import { memory } from "./workingMemory";

const agent = new Agent({
  id: "main",
  instructions: `
      You are a helpful assistant that helps users find pop-up retail spaces for their business.
 
      Your primary function is to help users find pop-up retail spaces for their business. When responding:
      - Always ask for a location if none is provided
      - If the location name isn't in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like the cost of the space, the size of the space, and the foot traffic of the space
      - Keep responses concise but informative
      - When a user provides their location, you should extract and remember their location information
      - Use the findNearbySpacesTool to fetch the pop-up retail spaces for the user
`,
  memory: memory,
  // Send the chat to Anthropic LLM
  model: createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(
    "claude-sonnet-4-5",
  ),
  name: "Main Agent",
});

export default new Mastra({
  agents: { agent },
  idGenerator: ulid,
  logger: new ConsoleLogger({ level: env.isDebug ? "debug" : "info" }),
});
