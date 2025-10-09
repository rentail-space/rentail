import { useChat } from "@ai-sdk/react";
import type { MastraMessageV2 } from "@mastra/core/memory";
import { captureException } from "@sentry/react-router";
import { DefaultChatTransport, type UIMessage, type UITools } from "ai";
import { last } from "es-toolkit";
import { useQueryState } from "nuqs";
import type {
  ChatGetPayload,
  PropertyGetPayload,
} from "prisma/generated/models";
import { Activity, useRef, useState } from "react";
import { Link, useLoaderData, useRouteLoaderData } from "react-router";
import { ulid } from "ulid";
import { StickToBottom } from "use-stick-to-bottom";
import Header from "~/components/layout/Header";
import findNearbyProperties from "~/lib/findNearbyProperties";
import truncateWords from "~/lib/truncateWords";
import InputForm from "~/routes/chat/InputForm";
import Messages from "~/routes/chat/Messages";
import ScrollButton from "~/routes/chat/ScrollButton";
import { getUserChat } from "~/sessions.server";
import type { Route } from "./+types/route";
import Properties from "./Properties";

export const handle = { hideLayout: true };

export async function loader({ request }: Route.LoaderArgs) {
  const { chat } = await getUserChat(request.headers);
  const properties = await findNearbyProperties({ chat, maxDistance: 20 });
  return { properties };
}

export default function Chat() {
  const { properties } = useLoaderData<typeof loader>();
  const [query, setQuery] = useQueryState("q");
  const data = useRouteLoaderData<{
    chat: ChatGetPayload<{ include: { user: true } }>;
    messages: MastraMessageV2[];
  }>("root");
  const chat = data?.chat;
  const initialMessages = data?.messages;
  const { error, messages, sendMessage, status, stop } = useChat<
    UIMessage<{ isAborted?: boolean }, { text: string }, UITools>
  >({
    id: chat?.id,
    messages: initialMessages?.map((message) => ({
      id: message.id,
      parts: message.content.parts.map((part) => ({
        text: "text" in part ? part.text : "",
        type: part.type as "text" | "reasoning",
      })),
      role: message.role,
    })),
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

        <Properties properties={properties ?? []} />

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
