import type { UIMessage, UITools } from "ai";

// On the client side, messages are based on UIMessage with our own metadata,
// tools, etc. In the database we store in Prisma Message format.
export type ClientMessage = UIMessage<
  { isAborted?: boolean },
  { text: string },
  UITools
>;
