import type { MastraMessageV2 } from "node_modules/@mastra/core/dist/agent/types";
import type { ChatGetPayload } from "prisma/generated/models";
import { createContext } from "react-router";

export default createContext<{
  chat?: ChatGetPayload<{ include: { user: true } }>;
  messages?: MastraMessageV2[];
  headers?: Headers;
}>({});
