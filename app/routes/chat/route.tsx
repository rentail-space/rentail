import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
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
    messages: conversation.messages.map((message) => ({
      id: message.id,
      role: message.role === "USER" ? "user" : "assistant",
      parts: [{ text: message.content, type: "text" }],
    })) as UIMessage<{ role: UIMessage["role"] }, { text: string }>[],
    transport: new DefaultChatTransport({ api: "/api/chat" }),
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
    <div className="flex h-screen flex-col bg-gray-50 inset-0">
      <Header />
      <StickToBottom initial="smooth" resize="smooth">
        <StickToBottom.Content>
          <Messages
            error={error}
            isSubmitting={status === "submitted"}
            messages={messages}
            inputRef={inputRef}
          />
          <ScrollButton />
        </StickToBottom.Content>

        <InputForm
          input={input}
          isTyping={status === "submitted"}
          onSubmit={onSubmit}
          setInput={setInput}
          inputRef={inputRef}
        />
      </StickToBottom>
    </div>
  );
}

function ScrollButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  return (
    !isAtBottom && (
      <button
        className="absolute right-4 bottom-4 rounded-full bg-white"
        onClick={() => scrollToBottom()}
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </button>
    )
  );
}
