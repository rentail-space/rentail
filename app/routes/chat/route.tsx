import { useChat } from "@ai-sdk/react";
import { captureException } from "@sentry/react-router";
import { DefaultChatTransport } from "ai";
import { useQueryState } from "nuqs";
import { useState } from "react";
import {
  type LoaderFunctionArgs,
  NavLink,
  useRouteLoaderData,
} from "react-router";
import { ulid } from "ulid";
import { StickToBottom } from "use-stick-to-bottom";
import AccountMenu from "~/components/layout/AccountMenu";
import findNearbyCenters from "~/lib/findNearbyCenters";
import welcome from "~/prompts/welcome.md?raw";
import type { loader as rootLoader } from "~/root";
import InputForm from "~/routes/chat/InputForm";
import Messages from "~/routes/chat/Messages";
import ScrollButton from "~/routes/chat/ScrollButton";
import { findUserAndChat } from "~/sessions.server";
import CentersList from "./CentersList";

export const handle = { hideLayout: true };

export async function loader({ request }: LoaderFunctionArgs) {
  const found = await findUserAndChat(request.headers);
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
  const [centers, setCenters] = useState(loaderData.centers);

  const { error, messages, sendMessage, status, stop } = useChat({
    id: chatId,
    generateId: () => ulid(),
    messages: initialMessages,
    resume: true, // Enable automatic stream resumption
    transport: new DefaultChatTransport({
      api: "/api/chat/message",
      // Only send user input to the server
    }),
    onError: (error) => {
      captureException(error, { extra: { chat: found?.chat } });
      console.error("Chat error: %s", error);
    },
    onFinish: () => {
      fetch(`/api/chat/${chatId}/centers`)
        .then((response) => response.json())
        .then(({ centers }) => setCenters(centers));
    },
  });

  return (
    <StickToBottom initial="smooth" resize="smooth">
      <div className="inset-0 flex h-screen flex-col">
        <header className="navbar shadow-sm print:hidden">
          <NavLink
            to="/"
            className="navbar-start font-bold text-2xl text-gray-900"
          >
            <span className="text-blue-600">rentail</span>.space
          </NavLink>
          <AccountMenu />
        </header>

        <StickToBottom.Content>
          <div className="flex flex-1 flex-row gap-4 lg:pr-4">
            <div className="flex flex-1 flex-col">
              <Messages
                error={error}
                isTyping={status === "streaming"}
                messages={messages}
                setQuery={setQuery}
              />
            </div>
            <div className="hidden lg:block lg:w-80 lg:shrink-0">
              <CentersList centers={centers} />
            </div>
          </div>
        </StickToBottom.Content>

        <ScrollButton />

        <InputForm
          isResponding={status === "streaming"}
          isSubmitting={status === "submitted"}
          query={query ?? ""}
          sendMessage={(message: string) =>
            sendMessage({
              parts: [{ text: message, type: "text" }],
              role: "user",
            })
          }
          setQuery={setQuery}
          stopChat={() => {
            if (chatId) {
              stop();
              fetch(`/api/chat/${chatId}/stop`, { method: "POST" });
            }
          }}
        />
      </div>
    </StickToBottom>
  );
}
