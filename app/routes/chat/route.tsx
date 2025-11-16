import { useChat } from "@ai-sdk/react";
import { captureException } from "@sentry/react-router";
import { DefaultChatTransport } from "ai";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { NavLink, useFetcher, useRouteLoaderData } from "react-router";
import { ulid } from "ulid";
import { StickToBottom } from "use-stick-to-bottom";
import AccountMenu from "~/components/layout/AccountMenu";
import welcome from "~/prompts/welcome.md?raw";
import type { loader as rootLoader } from "~/root";
import InputForm from "~/routes/chat/InputForm";
import Messages from "~/routes/chat/Messages";
import ScrollButton from "~/routes/chat/ScrollButton";
import CentersList from "./CentersList";

export const handle = { hideLayout: true };

export default function ChatPage() {
  const [query, setQuery] = useQueryState("q");

  // Access data from root loader first, our loaded depends on it
  const found = useRouteLoaderData<typeof rootLoader>("root");
  const [chatId] = useState(() => found?.chat?.id ?? ulid());
  const initialMessages = found?.messages ?? [
    { id: chatId, parts: [{ text: welcome, type: "text" }], role: "assistant" },
  ];
  const [isAborted, setIsAborted] = useState(false);
  const fetcher = useFetcher();

  const { error, messages, sendMessage, status, stop } = useChat({
    id: chatId,
    generateId: () => ulid(),
    messages: initialMessages,
    resume: true, // Enable automatic stream resumption
    transport: new DefaultChatTransport({
      api: `/api/chat/${chatId}/message`,
    }),
    onError: (error) => {
      captureException(error, { extra: { chatId } });
      console.error("Chat error: %s", error);
    },
    onFinish: ({ isAbort }) => {
      setIsAborted(isAbort);
      if (!isAbort) fetcher.load(`/api/chat/${chatId}/centers`);
    },
  });

  return (
    <StickToBottom initial="smooth" resize="smooth">
      <div className="inset-0 flex h-screen flex-col">
        <header className="navbar shadow-sm print:hidden">
          <NavLink
            to="/"
            className="navbar-start font-bold text-2xl text-gray-900"
          >
            <span className="text-blue-600">rentail</span>.space
          </NavLink>
          <AccountMenu />
        </header>

        <StickToBottom.Content>
          <div className="flex flex-1 flex-row gap-4 lg:pr-4">
            <div className="flex flex-1 flex-col">
              <Messages
                error={error}
                isTyping={status === "streaming"}
                messages={messages}
                setQuery={setQuery}
              />
              {isAborted && (
                <div className="text-red-500">This chat was aborted.</div>
              )}
            </div>

            <div className="top-0 hidden py-4 lg:block lg:w-80 lg:shrink-0">
              <CentersList centers={fetcher.data?.centers ?? []} />
            </div>
          </div>
        </StickToBottom.Content>

        <ScrollButton />

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
