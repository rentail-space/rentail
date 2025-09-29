import { jsPDF } from "jspdf";
import removeMd from "remove-markdown";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/api.chat.$id.export.pdf";

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;

  // Get chat with messages
  const chat = await prisma.chat.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!chat) throw new Response("Chat not found", { status: 404 });

  // Create PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  const maxWidth = pageWidth - 2 * margin;
  let currentY = margin;

  // Add title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Chat Conversation", margin, currentY);
  currentY += lineHeight * 2;

  // Add chat ID and date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Chat ID: ${id}`, margin, currentY);
  currentY += lineHeight;
  doc.text(
    `Exported: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    margin,
    currentY,
  );
  currentY += lineHeight * 2;

  // Add messages
  for (const message of chat.messages) {
    try {
      const content = JSON.parse(message.content as string);
      if (content.parts && Array.isArray(content.parts)) {
        const markdown = content.parts
          .filter((part: { type: string }) => part.type === "text")
          .map((part: { text: string }) => part.text)
          .join(" ");
        const text = removeMd(markdown);

        // Check if we need a new page
        if (currentY > pageHeight - margin - 20) {
          doc.addPage();
          currentY = margin;
        }

        // Add timestamp and role header
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        const timestamp = message.createdAt.toLocaleString();
        const roleText = `${message.role.toUpperCase()} - ${timestamp}`;
        doc.text(roleText, margin, currentY);
        currentY += lineHeight;

        // Add message content
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(text, maxWidth);

        for (const line of lines) {
          if (currentY > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
          }
          doc.text(line, margin, currentY);
          currentY += lineHeight;
        }

        currentY += lineHeight; // Add space between messages
      }
    } catch {}
  }

  return new Response(doc.output("arraybuffer"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="chat-${id}.pdf"`,
    },
  });
}
