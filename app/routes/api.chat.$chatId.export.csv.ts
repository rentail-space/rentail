import removeMd from "remove-markdown";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/api.chat.$chatId.export.csv";

export async function loader({ params }: Route.LoaderArgs) {
  const { chatId } = params;

  // Get chat with messages
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!chat) throw new Response("Chat not found", { status: 404 });

  // Generate CSV content
  const csvRows = [["Timestamp", "Role", "Content"].join(",")];

  for (const message of chat.messages) {
    const timestamp = message.createdAt.toISOString();
    const role = message.role;

    try {
      const content = JSON.parse(message.content as string);
      if (content.parts && Array.isArray(content.parts)) {
        const markdown = content.parts
          .filter((part: { type: string }) => part.type === "text")
          .map((part: { text: string }) => part.text)
          .join(" ");
        const text = removeMd(markdown);
        // Escape quotes and wrap in quotes for CSV
        const escapedText = text.replace(/"/g, '""');
        csvRows.push([timestamp, role, `"${escapedText}"`].join(","));
      }
    } catch {}
  }

  return new Response(csvRows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="chat-${chatId}.csv"`,
    },
  });
}
