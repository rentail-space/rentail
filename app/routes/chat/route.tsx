import { useChat } from "@ai-sdk/react";
import { captureException } from "@sentry/react-router";
import { DefaultChatTransport } from "ai";
import { last } from "es-toolkit";
import { useEffect, useRef, useState } from "react";
import { data, useLoaderData, useSearchParams } from "react-router";
import { ulid } from "ulid";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import Header from "~/components/layout/Header";
import { commit, getConversationFromSession } from "~/sessions.server";
import type { Route } from "./+types/route";
import { type ClientMessage, toClientMessage } from "./ClientMessage";
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
  const { error, messages, sendMessage, status, stop } = useChat<ClientMessage>(
    {
      id: conversation.id,
      messages: conversation.messages.map(toClientMessage),
      resume: true, // Enable automatic stream resumption
      transport: new DefaultChatTransport({
        api: "/api/chat",
        // only send the last message to the server:
        prepareSendMessagesRequest({ messages }) {
          return { body: { userMessage: last(messages) } };
        },
      }),
    },
  );
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle initial query from URL
  // biome-ignore lint/correctness/useExhaustiveDependencies: only once on mount
  useEffect(() => {
    const query = searchParams.get("q")?.trim();
    if (query) {
      sendMessage({ parts: [{ text: query, type: "text" }], role: "user" });
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

  const stopLLM = async (scrollToBottom: () => void) => {
    await Promise.all([
      // Stop the AI SDK stream
      stop(),
      // Send Redis stop signal for cross-request coordination
      fetch(`/api/chat/${conversation.id}/stop`, { method: "POST" }).catch(
        captureException,
      ),
    ]);

    messages.push({
      id: ulid(),
      metadata: { isAborted: true },
      parts: [],
      role: "user",
    });
    // Scroll to bottom after a small delay to ensure the message is rendered
    setTimeout(scrollToBottom, 10);
  };

  return (
    <StickToBottom initial="smooth" resize="smooth">
      <div className="flex h-screen flex-col inset-0">
        <Header />
        <StickToBottom.Content>
          <Messages
            error={error}
            inputRef={inputRef}
            isSubmitting={status === "submitted"}
            messages={messages}
          />
        </StickToBottom.Content>

        <ScrollButton />

        <InputForm
          input={input}
          inputRef={inputRef}
          isResponding={status === "streaming" || status === "submitted"}
          isSubmitting={status === "submitted"}
          onSubmit={onSubmit}
          stopLLM={stopLLM}
          setInput={setInput}
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
