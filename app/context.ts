import type { MastraMessageV2 } from "node_modules/@mastra/core/dist/agent/types";
import type { ChatGetPayload } from "prisma/generated/models";
import { createContext, type RouterContext } from "react-router";

export default createContext<{
  chat?: ChatGetPayload<{ include: { user: true } }>;
  messages?: MastraMessageV2[];
  headers?: Headers;
}>({});

// Add our strongly-typed props to AppLoadContext interface
declare module "react-router" {
  interface AppLoadContext extends RouterContext {
    chat?: ChatGetPayload<{ include: { user: true } }>;
    messages?: MastraMessageV2[];
    headers?: Headers;
  }
}
