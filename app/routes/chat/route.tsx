import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { last } from "es-toolkit";
import { useEffect, useRef, useState } from "react";
import { data, useLoaderData, useSearchParams } from "react-router";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import Header from "~/components/layout/Header";
import { commit, getConversationFromSession } from "~/sessions.server";
import type { Route } from "./+types/route";
import InputForm from "./InputForm";
import Messages from "./Messages";

export async function loader({ request }: Route.LoaderArgs) {
  const { conversation, user, session } =
    await getConversationFromSession(request);
  return data(
    { conversation, user },
    { headers: { "Set-Cookie": await commit(session) } },
  );
}

export default function Chat() {
  const [searchParams] = useSearchParams();
  const { conversation } = useLoaderData<typeof loader>();
  const { error, messages, sendMessage, status } = useChat({
    id: conversation.id,
    messages: conversation.messages.map((message) => ({
      id: message.id,
      role: message.role === "USER" ? "user" : "assistant",
      parts: [{ text: message.content, type: "text" }],
    })) as UIMessage<{ role: UIMessage["role"] }, { text: string }>[],
    resume: true, // Enable automatic stream resumption
    transport: new DefaultChatTransport({
      api: "/api/chat",
      // only send the last message to the server:
      prepareSendMessagesRequest({ messages, id }) {
        return { body: { message: last(messages), id } };
      },
    }),
  });
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle initial query from URL
  // biome-ignore lint/correctness/useExhaustiveDependencies: only once on mount
  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      sendMessage({
        parts: [{ text: query, type: "text" }],
        role: "user",
      });
      searchParams.delete("q");
    }
  }, []);

  const onSubmit = (input: string) => {
    sendMessage({
      parts: [{ text: input.trim(), type: "text" }],
      role: "user",
    });
    setInput("");
  };

  return (
    <StickToBottom initial="smooth" resize="smooth">
      <div className="flex h-screen flex-col inset-0">
        <Header />
        <StickToBottom.Content className="stick-to-bottom-content">
          <Messages
            error={error}
            isSubmitting={status === "submitted"}
            messages={messages}
            inputRef={inputRef}
          />
        </StickToBottom.Content>

        <ScrollButton />

        <InputForm
          input={input}
          inputRef={inputRef}
          isTyping={status === "submitted"}
          onSubmit={onSubmit}
          setInput={setInput}
          status={status}
        />
      </div>
    </StickToBottom>
  );
}

function ScrollButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  return (
    <button
      className="fixed right-6 bottom-24 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
      onClick={() => scrollToBottom()}
      type="button"
      aria-label="Scroll to bottom"
      title="Scroll to bottom"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-600"
      >
        <title>Scroll to bottom</title>
        <path d="M12 5v14M19 12l-7 7-7-7" />
      </svg>
    </button>
  );
}
