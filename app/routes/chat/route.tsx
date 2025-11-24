import { useChat } from "@ai-sdk/react";
import { captureException } from "@sentry/react-router";
import { DefaultChatTransport } from "ai";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { useFetcher, useRouteLoaderData } from "react-router";
import { ulid } from "ulid";
import { StickToBottom } from "use-stick-to-bottom";
import PageHeader from "~/components/layout/PageHeader";
import findNearbyCenters from "~/lib/findNearbyCenters";
import welcome from "~/prompts/welcome.md?raw";
import type { loader as rootLoader } from "~/root";
import InputForm from "~/routes/chat/InputForm";
import Messages from "~/routes/chat/Messages";
import ScrollButton from "~/routes/chat/ScrollButton";
import { findUserAndLastChat } from "~/sessions.server";
import type { Route } from "./+types/route";
import CenterCards from "./CenterCards";

export const handle = { hideLayout: true };

export async function loader({ request }: Route.LoaderArgs) {
  const found = await findUserAndLastChat(request.headers);
  const centers = await findNearbyCenters({
    headers: request.headers,
    user: found?.user,
  });
  return { centers };
}

export default function ChatPage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const [query, setQuery] = useQueryState("q");

  // Access data from root loader first, our loaded depends on it
  const found = useRouteLoaderData<typeof rootLoader>("root");
  const [chatId] = useState(() => found?.chat?.id ?? ulid());
  const initialMessages = found?.messages ?? [
    { id: chatId, parts: [{ text: welcome, type: "text" }], role: "assistant" },
  ];
  const [isAborted, setIsAborted] = useState(false);
  const centersFetcher = useFetcher<Awaited<ReturnType<typeof loader>>>();
  const stopFetcher = useFetcher();

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
      if (!isAbort) centersFetcher.load("/chat");
    },
  });

  return (
    <StickToBottom initial="smooth" resize="smooth">
      <div className="inset-0 flex h-screen flex-col">
        <PageHeader />

        <StickToBottom.Content>
          <div className="flex flex-row gap-4 lg:pr-4">
            <div className="flex min-h-[80lvh] flex-1 flex-col">
              <Messages
                error={error}
                isAborted={isAborted}
                isTyping={status === "streaming"}
                messages={messages}
                setQuery={setQuery}
              />
              {isAborted && (
                <div className="text-red-500">This chat was aborted.</div>
              )}
            </div>

            <CenterCards
              centers={centersFetcher.data?.centers ?? loaderData.centers}
            />
          </div>
        </StickToBottom.Content>

        <ScrollButton />

        <InputForm
          isResponding={status === "streaming"}
          isSubmitting={status === "submitted"}
          query={query ?? ""}
          sendMessage={async (message: string) => {
            await sendMessage({
              parts: [{ text: message, type: "text" }],
              role: "user",
            });
          }}
          setQuery={setQuery}
          stopChat={() => {
            stop();
            stopFetcher.submit(`/api/chat/${chatId}/stop`, {
              method: "POST",
              preventScrollReset: true,
            });
          }}
        />
      </div>
    </StickToBottom>
  );
}
