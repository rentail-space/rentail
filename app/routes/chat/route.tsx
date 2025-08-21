import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
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
    transport: new DefaultChatTransport({
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

  return (
    <div className="flex h-screen flex-col bg-gray-50 inset-0">
      <Header />
      <StickToBottom initial="smooth" resize="smooth">
        <StickToBottom.Content>
          <Messages
            error={error}
            setInput={setInput}
            isSubmitting={status === "submitted"}
            messages={messages}
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
