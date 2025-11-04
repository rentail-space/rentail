import { useChat } from "@ai-sdk/react";
import { captureException } from "@sentry/react-router";
import { DefaultChatTransport } from "ai";
import { last } from "es-toolkit";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { useRouteLoaderData } from "react-router";
import { ulid } from "ulid";
import { StickToBottom } from "use-stick-to-bottom";
import LayoutHeader from "~/components/layout/LayoutHeader";
import welcome from "~/prompts/welcome.md?raw";
import type { loader } from "~/root";
import InputForm from "~/routes/chat/InputForm";
import Messages from "~/routes/chat/Messages";
import ScrollButton from "~/routes/chat/ScrollButton";
import PropertyList from "./PropertyList";

export const handle = { showHeader: false, showFooter: false };

export default function ChatPage() {
  const [query, setQuery] = useQueryState("q");
  const [chatId] = useState(() => ulid());

  // Access data from root loader first, our loaded depends on it
  const found = useRouteLoaderData<typeof loader>("root");
  const initialMessages = found?.messages ?? [
    { id: chatId, parts: [{ text: welcome, type: "text" }], role: "assistant" },
  ];

  const { error, messages, sendMessage, status, stop } = useChat({
    id: chatId,
    generateId: () => ulid(),
    messages: initialMessages,
    resume: true, // Enable automatic stream resumption
    transport: new DefaultChatTransport({
      api: "/api/chat/message",
      // Only send user input to the server
    }),
    onError: (error) => {
      captureException(error, { extra: { chat: found?.chat } });
      console.error("Chat error: %s", error);
    },
  });

  return (
    <StickToBottom initial="smooth" resize="smooth">
      <div className="inset-0 flex h-screen flex-col">
        <LayoutHeader />
        <StickToBottom.Content>
          <Messages
            error={error}
            isTyping={status === "streaming"}
            messages={messages}
            setQuery={setQuery}
          />
        </StickToBottom.Content>

        <ScrollButton />

        <PropertyList
          chatId={chatId}
          lastAssistantMessage={last(
            messages?.filter((message) => message.role === "assistant"),
          )}
        />

        <InputForm
          isResponding={status === "streaming"}
          isSubmitting={status === "submitted"}
          query={query ?? ""}
          sendMessage={(message: string) =>
            sendMessage({
              parts: [{ text: message, type: "text" }],
              role: "user",
            })
          }
          setQuery={setQuery}
          stopChat={() => {
            if (chatId) {
              stop();
              fetch(`/api/chat/${chatId}/stop`, { method: "POST" });
            }
          }}
        />
      </div>
    </StickToBottom>
  );
}
