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
import { findUserAndLastChat } from "~/lib/sessions.server";
import welcome from "~/prompts/welcome.md?raw";
import type { loader as rootLoader } from "~/root";
import InputForm from "~/routes/chat/InputForm";
import Messages from "~/routes/chat/Messages";
import ScrollButton from "~/routes/chat/ScrollButton";
import type { Route } from "./+types/route";
import Centers from "./Centers";

export const handle = { hideLayout: true };

export async function loader({ request }: Route.LoaderArgs) {
  const found = await findUserAndLastChat(request);
  const { centers, displayName } = await findNearbyCenters({
    headers: request.headers,
    user: "user" in found ? found.user : undefined,
  });
  return { centers, displayName };
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
      console.error(`Chat error: ${error}`);
    },
    onFinish: ({ isAbort }) => {
      setIsAborted(isAbort);
      if (!isAbort) centersFetcher.load("/chat");
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
            centers={centersFetcher.data?.centers ?? loaderData.centers}
          />
        </div>

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
      </StickToBottom>
    </main>
  );
}
