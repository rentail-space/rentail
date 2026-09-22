import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { useCallback, useState } from "react";
import { data, useLoaderData, useSearchParams } from "react-router";
import invariant from "tiny-invariant";
import { ulid } from "ulid";
import { StickToBottom } from "use-stick-to-bottom";
import PageHeader from "~/components/layout/PageHeader";
import { findUserAndLastChat } from "~/lib/sessions.server";
import welcome from "~/prompts/welcome.md?raw";
import InputForm from "~/routes/chat/InputForm";
import Messages from "~/routes/chat/Messages";
import ScrollButton from "~/routes/chat/ScrollButton";
import type { Route as CentersRoute } from "../+types/api.chat.$chatId.centers";
import type { Route } from "./+types/route";
import Centers from "./Centers";

export const handle = { hideLayout: true };

/**
 * The conversation lives here rather than in the root loader: only this route
 * renders it, and keeping it out of the root document is what lets every other
 * page be served from the CDN.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const found = await findUserAndLastChat(request);
  return data(
    "chat" in found
      ? { chat: found.chat, messages: found.messages }
      : { chat: null, messages: null },
    { headers: found.responseHeaders },
  );
}

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  // Memoize setQuery to prevent re-creating on every render
  const setQuery = useCallback(
    (value: string | null) => {
      setSearchParams(
        (params) => {
          if (value === null || value === "") params.delete("q");
          else params.set("q", value);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Access data from the chat loader, which owns the conversation
  const found = useLoaderData<typeof loader>();
  const [chatId] = useState(() => found?.chat?.id ?? ulid());
  const initialMessages = found?.messages ?? [
    { id: chatId, parts: [{ text: welcome, type: "text" }], role: "assistant" },
  ];
  const [isAborted, setIsAborted] = useState(false);

  const centersQuery = useQuery({
    queryFn: async () => {
      const response = await fetch(`/api/chat/${chatId}/centers`);
      invariant(response.ok, "Failed to fetch centers");
      return (await response.json()) as CentersRoute.ComponentProps["loaderData"];
    },
    queryKey: ["centers", chatId],
  });

  const { error, messages, sendMessage, status } = useChat({
    id: chatId,
    generateId: () => ulid(),
    messages: initialMessages,
    resume: true, // Enable automatic stream resumption
    transport: new DefaultChatTransport({
      api: `/api/chat/${chatId}/message`,
    }),
    onError: (error) => {
      console.error(`Chat error: ${error}`);
    },
    onFinish: ({ isAbort }) => {
      setIsAborted(isAbort);
      if (!isAbort) void centersQuery.refetch();
    },
  });

  return (
    <main aria-label="Chat interface">
      <title>Specialty Leasing & Retail Spaces | Rentail.space</title>
      <meta
        name="description"
        content="Get instant help finding your ideal retail space. Chat with our AI assistant for expert recommendations and personalized matches."
      />
      <meta
        name="keywords"
        content="chat, specialty leasing, retail spaces, rentail.space"
      />
      <link rel="canonical" href="https://rentail.space/chat" />

      <StickToBottom
        initial="smooth"
        resize="smooth"
        className="inset-0 flex h-screen flex-col justify-between bg-[hsl(60,100%,99%)]"
      >
        <PageHeader />

        <div className="h-full overflow-y-auto scroll-smooth">
          <StickToBottom.Content className="h-full w-full lg:w-3/4 lg:px-5">
            <Messages
              error={error}
              isAborted={isAborted}
              isTyping={status === "streaming"}
              messages={messages}
              setQuery={setQuery}
            />
          </StickToBottom.Content>
          <Centers
            centers={centersQuery.data?.centers}
            isPending={centersQuery.isPending}
          />
        </div>

        <ScrollButton />

        <InputForm
          isSubmitting={status === "submitted"}
          query={query}
          sendMessage={async (message: string) => {
            if (message.trim() === "") return;
            await sendMessage({
              parts: [{ text: message, type: "text" }],
              role: "user",
            });
          }}
          setQuery={setQuery}
        />
      </StickToBottom>
    </main>
  );
}
