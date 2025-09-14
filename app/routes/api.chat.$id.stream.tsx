import type { UIMessage } from "ai";
import { data } from "react-router";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/api.chat.$id.stream";

export async function loader({ params }: Route.LoaderArgs) {
  const { id: conversationId } = params;
  const dbMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  const uiMessages = dbMessages.map((message) => ({
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    parts: [{ text: message.content, type: "text" }],
  })) as UIMessage[];
  return data(uiMessages);
}
