import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { data, type LoaderFunctionArgs, useSearchParams } from "react-router";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import Header from "~/components/layout/Header";
import welcome from "~/lib/welcome.md?raw";
import { commitSession, getSession } from "~/sessions.server";
import InputForm from "./InputForm";
import Messages from "./Messages";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const interactions = (session.get("interactions") || 0) + 1;
  session.set("interactions", interactions);
  return data(null, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showThreeMessages, setShowThreeMessages] = useState(false);

  const { error, messages, sendMessage, status } = useChat({
    messages: [
      {
        parts: [{ text: welcome, type: "text" }],
        role: "assistant",
      } as UIMessage,
      {
        parts: [
          {
            text: `I'm looking for a pop-up retail space for my clothing boutique.
            
Do you have any locations available in downtown areas?`,
            type: "text",
          },
        ],
        role: "user",
      } as UIMessage,
      {
        parts: [
          {
            text: `Great! I'd be happy to help you find a pop-up retail space for your clothing boutique.
            
We have several exciting downtown locations available. Can you tell me more about your specific requirements?

For example, what's your preferred square footage, duration of lease, and budget range?`,
            type: "text",
          },
        ],
        role: "assistant",
      } as UIMessage,
    ],
    transport: new TextStreamChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const initialQuery = searchParams.get("q");

  // Handle initial query from URL
  // biome-ignore lint/correctness/useExhaustiveDependencies: only once on mount
  useEffect(() => {
    if (initialQuery && messages.length === 1) {
      sendMessage({
        parts: [{ text: initialQuery, type: "text" }],
        role: "user",
      } as UIMessage);
    }
  }, []);

  const onSubmit = async (input: string) => {
    await sendMessage({
      parts: [{ text: input.trim(), type: "text" }],
      role: "user",
    } as UIMessage);
    setSearchParams((prev) => ({ ...prev, q: input.trim() }));
  };
  const displayedMessages = showThreeMessages
    ? messages.slice(0, 1)
    : messages.slice(0, 3);

  return (
    <div className="flex h-screen flex-col bg-gray-50 inset-0">
      <Header />
      <div className="flex justify-end p-4">
        <ToggleButton
          showThreeMessages={showThreeMessages}
          onToggle={setShowThreeMessages}
        />
      </div>
      <StickToBottom initial="smooth" resize="smooth">
        <StickToBottom.Content>
          <Messages
            error={error}
            setInput={setInput}
            isSubmitting={status === "submitted"}
            messages={displayedMessages}
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

function ToggleButton({
  showThreeMessages,
  onToggle,
}: {
  showThreeMessages: boolean;
  onToggle: (show: boolean) => void;
}) {
  return (
    <button
      className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onClick={() => onToggle(!showThreeMessages)}
      type="button"
    >
      <span>{showThreeMessages ? "Show 1 Message" : "Show 3 Messages"}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        {showThreeMessages ? (
          <path d="M18 6L6 18M6 6l12 12" />
        ) : (
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        )}
      </svg>
    </button>
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
