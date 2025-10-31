import { useChat } from "@ai-sdk/react";
import { captureException } from "@sentry/react-router";
import { DefaultChatTransport } from "ai";
import { invariant, last } from "es-toolkit";
import { useQueryState } from "nuqs";
import { useRouteLoaderData } from "react-router";
import { ulid } from "ulid";
import { StickToBottom } from "use-stick-to-bottom";
import LayoutHeader from "~/components/layout/LayoutHeader";
import type { loader } from "~/root";
import InputForm from "~/routes/chat/InputForm";
import Messages from "~/routes/chat/Messages";
import ScrollButton from "~/routes/chat/ScrollButton";
import PropertyList from "./PropertyList";

export const handle = { showHeader: false, showFooter: false };

export default function ChatPage() {
  const [query, setQuery] = useQueryState("q");

  // Access data from root loader first, our loaded depends on it
  const found = useRouteLoaderData<typeof loader>("root");
  invariant(found, "No root loader data found");

  // Ensure chatId is stable across renders
  const chatId = found.chat?.id ?? ulid();

  const { error, messages, sendMessage, status, stop } = useChat({
    generateId: () => ulid(),
    id: chatId,
    messages: found.messages,
    resume: true, // Enable automatic stream resumption
    transport: new DefaultChatTransport({
      api: `/api/chat/${chatId}/message`,
      // Only send user input to the server
    }),
    onError: (error) => {
      console.error("Chat error:", error);
      captureException(error, { extra: { chatId } });
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
