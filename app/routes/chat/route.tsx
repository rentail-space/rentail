import { useChat } from "@ai-sdk/react";
import { captureException } from "@sentry/react-router";
import { DefaultChatTransport, type UIMessage, type UITools } from "ai";
import { last } from "es-toolkit";
import { useQueryState } from "nuqs";
import { useRef } from "react";
import { data, useLoaderData } from "react-router";
import { ulid } from "ulid";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import Header from "~/components/layout/Header";
import { getChatFromSession } from "~/sessions.server";
import type { Route } from "./+types/route";
import InputForm from "./InputForm";
import Messages from "./Messages";

export async function loader({ request }: Route.LoaderArgs) {
  const { chat, messages, headers } = await getChatFromSession(request);
  return data({ chat, messages }, { headers });
}

export default function Chat() {
  const [query, setQuery] = useQueryState("q");
  const { chat, messages: initialMessages } = useLoaderData<typeof loader>();
  const { error, messages, sendMessage, status, stop } = useChat<
    UIMessage<{ isAborted?: boolean }, { text: string }, UITools>
  >({
    id: chat.id,
    messages: initialMessages.map((message) => ({
      id: message.id,
      parts: message.content.parts.map((part) => ({
        text: "text" in part ? part.text : "",
        type: part.type as "text" | "reasoning",
      })),
      role: message.role,
    })),
    onError: (error) => {
      console.error("Chat error:", error);
      captureException(error);
    },
    resume: false, // Enable automatic stream resumption
    transport: new DefaultChatTransport({
      api: "/api/chat",
      // only send the last message to the server:
      prepareSendMessagesRequest({ messages }) {
        return { body: { userMessage: last(messages) } };
      },
    }),
  });
  const ref = useRef<HTMLInputElement>(null);

  const onSubmit = (input: string) => {
    sendMessage({
      parts: [{ text: input.trim(), type: "text" }],
      role: "user",
    });
    setQuery(null);
  };

  const stopLLM = async (scrollToBottom: () => void) => {
    messages.push({
      id: ulid(),
      metadata: { isAborted: true },
      parts: [],
      role: "user",
    });

    // Send Redis stop signal for cross-request coordination
    await fetch(`/api/chat/${chat.id}/stop`, { method: "POST" }).catch(
      captureException,
    );
    await stop(); // Stop the AI SDK stream

    // Force a re-render to show the aborted state
    setQuery(null);
    // Scroll to bottom after a small delay to ensure the message is rendered
    setTimeout(scrollToBottom, 10);
  };

  return (
    <StickToBottom initial="smooth" resize="smooth">
      <div className="flex h-screen flex-col inset-0">
        <Header chatId={chat.id} />

        <StickToBottom.Content>
          <Messages
            error={error}
            inputRef={ref}
            isTyping={status === "streaming"}
            messages={messages}
            setQuery={setQuery}
          />
        </StickToBottom.Content>

        <ScrollButton />

        <InputForm
          isResponding={status === "streaming" || status === "submitted"}
          isSubmitting={status === "submitted"}
          onSubmit={onSubmit}
          query={query ?? ""}
          ref={ref}
          setQuery={setQuery}
          stopLLM={stopLLM}
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
