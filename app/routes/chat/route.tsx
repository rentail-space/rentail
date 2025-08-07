/** biome-ignore-all lint/a11y/noAutofocus: User needs to focus on input field */
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport, type UIMessage } from "ai";
import {
  type FormEvent,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { data, type LoaderFunctionArgs, useSearchParams } from "react-router";
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

import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

export default function Chat() {
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const [canEdit, setCanEdit] = useState(true);

  const { error, messages, sendMessage, status } = useChat({
    messages: [
      {
        parts: [{ text: welcome, type: "text" }],
        role: "assistant",
      } as UIMessage,
    ],
    onFinish: () => setCanEdit(true),
    transport: new TextStreamChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");

  const isTyping = status === "submitted";
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
    setCanEdit(false);
    return false;
  };

  return (
    <div className="h-screen relative bg-gray-50 flex flex-col">
      <Header />
      <StickToBottom
        className="overflow-auto "
        initial="smooth"
        resize="smooth"
        role="log"
      >
        <StickToBottom.Content>
          <Messages
            askQuestion={askQuestion}
            error={error}
            inputId={inputId}
            isTyping={isTyping}
            messages={messages}
            messagesRef={messagesRef}
            setInput={setInput}
          />
        </StickToBottom.Content>
        <ScrollButton />
        <section>
          <InputForm
            canEdit={canEdit}
            input={input}
            inputId={inputId}
            isTyping={isTyping}
            onSubmit={onSubmit}
            setInput={setInput}
          />
          <PrecannedQuestions
            askQuestion={askQuestion}
            inputId={inputId}
            messagesRef={messagesRef}
            setInput={setInput}
          />
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

async function askQuestion({
  inputId,
  messagesRef,
  question,
  setInput,
}: {
  inputId: string;
  messagesRef: RefObject<HTMLDivElement | null>;
  question: string;
  setInput: (input: string) => void;
}) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  if (!input) return;

  // Clear input and make it readonly during typing animation
  input.value = "";
  input.readOnly = true;
  setInput(input.value);

  // Auto-scroll to bottom
  if (messagesRef.current) {
    messagesRef.current.scrollTo({
      behavior: "smooth",
      top: messagesRef.current.scrollHeight,
    });
  }

  input.focus();

  // Animate typing the question
  for (let i = 0; i < question.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    input.value += question[i];
  }

  // Re-enable input and trigger change event
  input.readOnly = false;
  setInput(input.value);
}
