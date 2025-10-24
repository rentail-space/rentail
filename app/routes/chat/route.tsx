import { useChat } from "@ai-sdk/react";
import type { MastraMessageV2 } from "@mastra/core/memory";
import { captureException } from "@sentry/react-router";
import { DefaultChatTransport, type UIMessage, type UITools } from "ai";
import { last } from "es-toolkit";
import { useQueryState } from "nuqs";
import type { ChatGetPayload } from "prisma/generated/models";
import { useRef } from "react";
import { useRouteLoaderData } from "react-router";
import { ulid } from "ulid";
import { StickToBottom } from "use-stick-to-bottom";
import Header from "~/components/layout/Header";
import authServer from "~/lib/auth.server";
import findNearbyProperties from "~/lib/findNearbyProperties";
import prisma from "~/lib/prisma";
import InputForm from "~/routes/chat/InputForm";
import Messages from "~/routes/chat/Messages";
import ScrollButton from "~/routes/chat/ScrollButton";
import type { Route } from "./+types/route";
import PropertyList from "./PropertyList";

export const handle = { hideLayout: true };

export async function loader({ request }: Route.LoaderArgs) {
  const session = await authServer.api.getSession({ headers: request.headers });
  if (session) {
    // Query existing chat (don't create)
    const chat = await prisma.chat.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: { user: true },
    });
    if (chat) {
      const properties = await findNearbyProperties({ chat, maxDistance: 20 });
      return { properties };
    }
  }
}

export default function Chat({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const [query, setQuery] = useQueryState("q");

  // Access data from root loader first, our loaded depends on it
  const { chat, messages: initialMessages } = useRouteLoaderData("root") as {
    chat: ChatGetPayload<{ include: { user: true } }>;
    messages: MastraMessageV2[];
  };
  const properties = loaderData?.properties ?? [];

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
    resume: false, // Enable automatic stream resumption
    transport: new DefaultChatTransport({
      api: "/api/chat",
      // only send the last message to the server:
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            chatId: chat.id,
            message: last(messages) as UIMessage,
          },
        };
      },
    }),

    onError: (error) => {
      console.error("Chat error:", error);
      captureException(error, { extra: { chat } });
    },
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
      <div className="inset-0 flex h-screen flex-col">
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

        <PropertyList properties={properties} />

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
