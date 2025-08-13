/** biome-ignore-all lint/a11y/noAutofocus: User needs to focus on input field */
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport, type UIMessage } from "ai";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { data, type LoaderFunctionArgs, useSearchParams } from "react-router";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import Header from "~/components/layout/Header";
import welcome from "~/lib/welcome.md?raw";
import { commitSession, getSession } from "~/sessions.server";
import InputForm from "./InputForm";
import Messages from "./Messages";
import PrecannedQuestions from "./PrecannedQuestions";

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
    ],
    transport: new TextStreamChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");

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

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage({
      parts: [{ text: input.trim(), type: "text" }],
      role: "user",
    } as UIMessage);
    setSearchParams((prev) => ({ ...prev, q: input.trim() }));
    return false;
  };

  return (
    <div className="h-screen relative bg-gray-50 flex flex-col">
      <Header />
      <StickToBottom
        className="overflow-auto h-screen"
        initial="smooth"
        resize="smooth"
        role="log"
      >
        <StickToBottom.Content>
          <Messages
            error={error}
            setInput={setInput}
            isSubmitting={status === "submitted"}
            messages={messages}
          />
        </StickToBottom.Content>
        <ScrollButton />

        <section>
          <InputForm
            input={input}
            isSubmitting={status === "submitted"}
            onSubmit={onSubmit}
            setInput={setInput}
          />
          <PrecannedQuestions setInput={setInput} />
        </section>
      </StickToBottom>
    </div>
  );
}

function ScrollButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    !isAtBottom && (
      <button
        className="absolute bottom-4 right-4 rounded-full bg-white"
        onClick={handleScrollToBottom}
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
