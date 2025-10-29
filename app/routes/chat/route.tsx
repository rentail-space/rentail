import { useChat } from "@ai-sdk/react";
import type { MastraMessageV2 } from "@mastra/core/memory";
import { captureException } from "@sentry/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import { last } from "es-toolkit";
import { useQueryState } from "nuqs";
import type { ChatGetPayload } from "prisma/generated/models";
import { useRef } from "react";
import { useRouteLoaderData } from "react-router";
import { ulid } from "ulid";
import { StickToBottom } from "use-stick-to-bottom";
import LayoutHeader from "~/components/layout/LayoutHeader";
import InputForm from "~/routes/chat/InputForm";
import Messages from "~/routes/chat/Messages";
import ScrollButton from "~/routes/chat/ScrollButton";
import PropertyList from "./PropertyList";

export const handle = { showHeader: false, showFooter: false };

export default function Chat() {
  const [query, setQuery] = useQueryState("q");

  // Access data from root loader first, our loaded depends on it
  const { chat, messages: initialMessages } = useRouteLoaderData("root") as {
    chat?: ChatGetPayload<{ include: { user: true } }>;
    messages?: MastraMessageV2[];
  };

  const chatId = chat?.id ?? ulid();
  const { error, messages, sendMessage, status, stop } = useChat({
    id: chatId,
    messages: initialMessages?.map((message) => ({
      id: message.id,
      threadId: chatId,
      parts: message.content.parts
        .filter((part) => part.type === "text" || part.type === "reasoning")
        .map((part) => ({
          text: "text" in part ? part.text : "",
          type: part.type as "text" | "reasoning",
          details: part.type === "reasoning" ? part.details : undefined,
        })),
      role: message.role,
    })),
    transport: new DefaultChatTransport({
      api: `/api/chat/${chatId}/message`,
      // only send the last message to the server:
      prepareSendMessagesRequest({ messages }) {
        const message = last(messages) as UIMessage;
        return {
          body: {
            message: message.parts
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("\n"),
          },
        };
      },
    }),

    onError: (error) => {
      console.error("Chat error:", error);
      captureException(error, { extra: { chat } });
    },
  });
  const inputRef = useRef<HTMLInputElement>(null);

  function stopChat() {
    if (chat?.id) {
      stop();
      fetch(`/api/chat/${chat.id}/stop`, { method: "POST" });
    }
  }

  return (
    <StickToBottom initial="smooth" resize="smooth">
      <div className="inset-0 flex h-screen flex-col">
        <LayoutHeader />
        <StickToBottom.Content>
          <Messages
            error={error}
            inputRef={inputRef}
            isTyping={status === "streaming"}
            messages={messages}
            setQuery={setQuery}
          />
        </StickToBottom.Content>

        <ScrollButton />

        <PropertyList chatId={chatId} messages={messages} />

        <InputForm
          inputRef={inputRef}
          isResponding={status === "streaming"}
          isSubmitting={status === "submitted"}
          query={query ?? ""}
          sendMessage={(message: string) =>
            sendMessage({
              threadId: chatId,
              parts: [{ text: message, type: "text", details: undefined }],
              role: "user",
            })
          }
          setQuery={setQuery}
          stopChat={stopChat}
        />
      </div>
    </StickToBottom>
  );
}
