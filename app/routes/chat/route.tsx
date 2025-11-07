import { useChat } from "@ai-sdk/react";
import { captureException } from "@sentry/react-router";
import { DefaultChatTransport } from "ai";
import { useQueryState } from "nuqs";
import type { PropertyGetPayload } from "prisma/generated/models";
import { useState } from "react";
import { NavLink, useRouteLoaderData } from "react-router";
import { ulid } from "ulid";
import { StickToBottom } from "use-stick-to-bottom";
import AccountMenu from "~/components/layout/AccountMenu";
import welcome from "~/prompts/welcome.md?raw";
import type { loader } from "~/root";
import InputForm from "~/routes/chat/InputForm";
import Messages from "~/routes/chat/Messages";
import ScrollButton from "~/routes/chat/ScrollButton";
import PropertyList from "./PropertyList";

export const handle = { hideLayout: true };

export default function ChatPage() {
  const [query, setQuery] = useQueryState("q");

  // Access data from root loader first, our loaded depends on it
  const found = useRouteLoaderData<typeof loader>("root");
  const [chatId] = useState(() => found?.chat?.id ?? ulid());
  const initialMessages = found?.messages ?? [
    { id: chatId, parts: [{ text: welcome, type: "text" }], role: "assistant" },
  ];
  const [properties, setProperties] = useState<
    PropertyGetPayload<{ include: { spaces: true } }>[]
  >([]);

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
    onFinish: () => {
      fetch(`/api/chat/${chatId}/properties`)
        .then((response) => response.json())
        .then((data) => setProperties(data.properties));
    },
  });

  return (
    <StickToBottom initial="smooth" resize="smooth">
      <div className="inset-0 flex h-screen flex-col">
        <header className="flex flex-row items-center justify-between gap-8 border-b bg-white px-6 py-4 print:hidden">
          <NavLink to="/" className="font-bold text-2xl text-gray-900">
            <span className="text-blue-600">rentail</span>.space
          </NavLink>
          <AccountMenu />
        </header>

        <StickToBottom.Content>
          <Messages
            error={error}
            isTyping={status === "streaming"}
            messages={messages}
            setQuery={setQuery}
          />
        </StickToBottom.Content>

        <ScrollButton />

        <PropertyList properties={properties} />

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
