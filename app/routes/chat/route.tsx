import { useChat } from "@ai-sdk/react";
import { captureException } from "@sentry/react-router";
import { DefaultChatTransport, type UIMessage, type UITools } from "ai";
import { last } from "es-toolkit";
import { useQueryState } from "nuqs";
import { useRef } from "react";
import { useLoaderData } from "react-router";
import { ulid } from "ulid";
import { StickToBottom } from "use-stick-to-bottom";
import Header from "~/components/layout/Header";
import appContext from "~/context";
import InputForm from "~/routes/chat/InputForm";
import Messages from "~/routes/chat/Messages";
import ScrollButton from "~/routes/chat/ScrollButton";
import type { Route } from "./+types/route";

export const handle = { hideLayout: true };

/**
 * Chat route loader - accesses user/chat data from root context.
 * Context is set by root loader, so we can use chat.user for any server-side logic.
 *
 * Example usage:
 * - Load user-specific data: await findNearbyProperties({ chat: context.chat, maxDistance: 20 })
 * - Access user location: context.chat.user.geocode
 * - Check user permissions: context.chat.user.isAnonymous
 */
export async function loader({ context }: Route.LoaderArgs) {
  const { chat, messages } = context.get(appContext);
  return { chat, messages };
}

export default function Chat() {
  const [query, setQuery] = useQueryState("q");
  const { chat, messages: initialMessages } = useLoaderData<typeof loader>();
  const { error, messages, sendMessage, status, stop } = useChat<
    UIMessage<{ isAborted?: boolean }, { text: string }, UITools>
  >({
    id: chat?.id,
    messages:
      initialMessages?.map((message) => ({
        id: message.id,
        parts: message.content.parts.map((part) => ({
          text: "text" in part ? part.text : "",
          type: part.type as "text" | "reasoning",
        })),
        role: message.role,
      })) ?? [],
    onError: (error) => {
      console.error("Chat error:", error);
      captureException(error, { extra: { chat } });
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
  const inputRef = useRef<HTMLInputElement>(null);

  const stopLLM = async (scrollToBottom: () => void) => {
    messages.push({
      id: ulid(),
      metadata: { isAborted: true },
      parts: [],
      role: "user",
    });

    // Send Redis stop signal for cross-request coordination
    await fetch(`/api/chat/${chat?.id}/stop`, { method: "POST" }).catch(
      (error) => captureException(error, { extra: { chat } }),
    );
    await stop(); // Stop the AI SDK stream

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
            isTyping={status === "streaming"}
            messages={messages}
            setQuery={setQuery}
          />
        </StickToBottom.Content>

        <ScrollButton />

        <InputForm
          inputRef={inputRef}
          isResponding={status === "streaming" || status === "submitted"}
          isSubmitting={status === "submitted"}
          query={query ?? ""}
          sendMessage={sendMessage}
          setQuery={setQuery}
          stopLLM={stopLLM}
        />
      </div>
    </StickToBottom>
  );
}
