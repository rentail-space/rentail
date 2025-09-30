import MarkdownIt from "markdown-it";
import type * as pdfMakeType from "pdfmake/interfaces";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/api.chat.$id.export.pdf";

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;
  const chat = await prisma.chat.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!chat) throw new Response("Chat not found", { status: 404 });

  // Import pdfmake dynamically (server-side only)
  const pdfMake = await import("pdfmake/build/pdfmake.js");
  const pdfFonts = await import("pdfmake/build/vfs_fonts.js");

  // Set up fonts
  // @ts-expect-error - pdfMake types are incomplete
  pdfMake.default.vfs = pdfFonts.default;

  const md = new MarkdownIt();

  // Build document content
  const content: pdfMakeType.Content = [
    {
      text: "Chat Conversation",
      style: "header",
      margin: [0, 0, 0, 20] as [number, number, number, number],
    },
    {
      columns: [
        { text: `Chat ID: ${id}`, style: "metadata" },
        {
          text: `Exported: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
          style: "metadata",
          alignment: "right",
        },
      ],
      margin: [0, 0, 0, 20] as [number, number, number, number],
    },
  ];

  // Process messages
  for (const message of chat.messages) {
    // Parse content and extract text
    let markdown = "";
    try {
      const messageContent = JSON.parse(message.content as string);
      if (messageContent.parts && Array.isArray(messageContent.parts)) {
        markdown = messageContent.parts
          .filter((part: { type: string }) => part.type === "text")
          .map((part: { text: string }) => part.text)
          .join("\n");
      }
    } catch {
      markdown = String(message.content);
    }

    // Add message header
    content.push({
      text: `${message.role.toUpperCase()} - ${message.createdAt.toLocaleString()}`,
      style: "messageHeader",
      margin: [0, 10, 0, 5] as [number, number, number, number],
    });

    // Parse markdown and convert to pdfmake format
    const parsedContent = parseMarkdownToPdfMake(md.parse(markdown, {}));
    content.push({
      stack: parsedContent,
      margin: [0, 0, 0, 15] as [number, number, number, number],
    });
  }

  // Define document
  const docDefinition: pdfMakeType.TDocumentDefinitions = {
    content,
    defaultStyle: { fontSize: 11, color: "#000000" },
    pageMargins: [40, 40, 40, 40],
    styles: {
      bold: { bold: true },
      code: { font: "Courier", background: "#f3f4f6", fontSize: 10 },
      codeBlock: {
        font: "Courier",
        background: "#f3f4f6",
        fontSize: 9,
        margin: [0, 5, 0, 5],
      },
      h1: { fontSize: 18, bold: true, margin: [0, 10, 0, 5] },
      h2: { fontSize: 16, bold: true, margin: [0, 8, 0, 4] },
      h3: { fontSize: 14, bold: true, margin: [0, 6, 0, 3] },
      header: { fontSize: 20, bold: true, color: "#2563eb" },
      italic: { italics: true },
      link: { color: "#2563eb", decoration: "underline" },
      listItem: { margin: [0, 2, 0, 2] },
      messageHeader: { fontSize: 10, bold: true, color: "#374151" },
      metadata: { fontSize: 9, color: "#666666" },
      paragraph: { fontSize: 11, lineHeight: 1.5, margin: [0, 5, 0, 5] },
    },
  };

  // Generate PDF
  const pdfDoc = pdfMake.default.createPdf(docDefinition);
  const buffer = await new Promise<Buffer>((resolve) => {
    pdfDoc.getBuffer(resolve);
  });
  return new Response(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="chat-${id}.pdf"`,
    },
  });
}

// Helper function to parse markdown tokens to pdfmake format
function parseMarkdownToPdfMake(
  tokens: ReturnType<MarkdownIt["parse"]>,
): pdfMakeType.Content[] {
  const content: pdfMakeType.Content[] = [];
  let listItems: pdfMakeType.Content[] = [];
  let orderedList = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    switch (token.type) {
      case "heading_open": {
        const level = Number.parseInt(token.tag.substring(1), 10);
        const nextToken = tokens[i + 1];
        if (nextToken && nextToken.type === "inline") {
          content.push({
            text: parseInlineContent(nextToken.children || []),
            style: `h${level}` as "h1" | "h2" | "h3",
          });
        }
        i += 2; // Skip heading_close
        break;
      }

      case "paragraph_open": {
        const nextToken = tokens[i + 1];
        if (nextToken && nextToken.type === "inline") {
          const textContent = parseInlineContent(nextToken.children || []);
          if (Array.isArray(textContent) && textContent.length > 0) {
            content.push({
              text: textContent,
              style: "paragraph",
            });
          }
        }
        i += 2; // Skip paragraph_close
        break;
      }

      case "bullet_list_open":
      case "ordered_list_open": {
        orderedList = token.type === "ordered_list_open";
        listItems = [];
        break;
      }

      case "bullet_list_close":
      case "ordered_list_close": {
        if (listItems.length > 0) {
          content.push(
            orderedList
              ? {
                  ol: listItems,
                  margin: [0, 5, 0, 5] as [number, number, number, number],
                }
              : {
                  ul: listItems,
                  margin: [0, 5, 0, 5] as [number, number, number, number],
                },
          );
        }
        listItems = [];
        break;
      }

      case "list_item_open": {
        // Look ahead to find the content
        let j = i + 1;
        const itemContent: pdfMakeType.Content[] = [];
        while (j < tokens.length && tokens[j].type !== "list_item_close") {
          if (tokens[j].type === "paragraph_open") {
            const inlineToken = tokens[j + 1];
            if (inlineToken && inlineToken.type === "inline") {
              itemContent.push({
                text: parseInlineContent(inlineToken.children || []),
              });
            }
            j += 2;
          } else if (tokens[j].type === "inline") {
            itemContent.push({
              text: parseInlineContent(tokens[j].children || []),
            });
            j++;
          } else {
            j++;
          }
        }
        if (itemContent.length > 0) {
          listItems.push(itemContent);
        }
        i = j;
        break;
      }

      case "code_block":
      case "fence": {
        content.push({
          text: token.content.trim(),
          style: "codeBlock",
        });
        break;
      }

      case "hr": {
        content.push({
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 0.5,
              lineColor: "#cccccc",
            },
          ],
          margin: [0, 10, 0, 10] as [number, number, number, number],
        });
        break;
      }

      case "blockquote_open": {
        const quoteContent: pdfMakeType.Content[] = [];
        let j = i + 1;
        while (j < tokens.length && tokens[j].type !== "blockquote_close") {
          if (tokens[j].type === "paragraph_open") {
            const inlineToken = tokens[j + 1];
            if (inlineToken && inlineToken.type === "inline") {
              quoteContent.push({
                text: parseInlineContent(inlineToken.children || []),
              });
            }
            j += 2;
          } else {
            j++;
          }
        }
        content.push({
          stack: quoteContent,
          margin: [20, 5, 0, 5] as [number, number, number, number],
          color: "#666666",
          italics: true,
        });
        i = j;
        break;
      }
    }
  }

  return content;
}

// Helper function to parse inline markdown content
function parseInlineContent(
  tokens: ReturnType<MarkdownIt["parse"]>,
): pdfMakeType.Content {
  const result: pdfMakeType.Content = [];

  for (const token of tokens) {
    switch (token.type) {
      case "text": {
        result.push({ text: token.content });
        break;
      }

      case "strong_open": {
        // Find content until strong_close
        const contentTokens: typeof tokens = [];
        let j = tokens.indexOf(token) + 1;
        while (j < tokens.length && tokens[j].type !== "strong_close") {
          contentTokens.push(tokens[j]);
          j++;
        }
        result.push({
          text: parseInlineContent(contentTokens),
          bold: true,
        });
        break;
      }

      case "em_open": {
        // Find content until em_close
        const contentTokens: typeof tokens = [];
        let j = tokens.indexOf(token) + 1;
        while (j < tokens.length && tokens[j].type !== "em_close") {
          contentTokens.push(tokens[j]);
          j++;
        }
        result.push({
          text: parseInlineContent(contentTokens),
          italics: true,
        });
        break;
      }

      case "code_inline": {
        result.push({
          text: token.content,
          style: "code",
        });
        break;
      }

      case "link_open": {
        const href = token.attrGet("href") || "";
        // Find the text content
        let j = tokens.indexOf(token) + 1;
        const linkText: typeof tokens = [];
        while (j < tokens.length && tokens[j].type !== "link_close") {
          linkText.push(tokens[j]);
          j++;
        }
        result.push({
          text: parseInlineContent(linkText),
          link: href,
          style: "link",
        });
        break;
      }

      case "softbreak":
      case "hardbreak": {
        result.push({ text: "\n" });
        break;
      }

      // Skip closing tokens as they're handled by opening tokens
      case "strong_close":
      case "em_close":
      case "link_close": {
        break;
      }
    }
  }

  return result;
}
