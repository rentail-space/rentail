/** biome-ignore-all lint/a11y/noAutofocus: User needs to focus on input field */
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  type FormEvent,
  type RefObject,
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
import PrecannedQuestions from "./PrecannedQuestions";
import ResponseMessage from "./ResponseMessage";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const interactions = (session.get("interactions") || 0) + 1;
  session.set("interactions", interactions);
  return data(null, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export default function Chat() {
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const [canEdit, setCanEdit] = useState(true);

  const { error, messages, sendMessage, status } = useChat({
    messages: [{ parts: [{ text: welcome }], role: "assistant" } as UIMessage],
    onFinish: () => setCanEdit(true),
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");

  const isTyping = status === "submitted";
  const initialQuery = searchParams.get("q");

  // Handle initial query from URL
  // biome-ignore lint/correctness/useExhaustiveDependencies: only once on mount
  useEffect(() => {
    if (initialQuery && messages.length === 1) {
      sendMessage({
        parts: [{ text: initialQuery }],
        role: "user",
      } as UIMessage);
    }
  }, []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage({
      parts: [{ text: input.trim() }],
      role: "user",
    } as UIMessage);
    setSearchParams((prev) => ({ ...prev, q: input.trim() }));
    setCanEdit(false);
    return false;
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header />
      <Messages
        error={error}
        inputId={inputId}
        isTyping={isTyping}
        messages={messages}
        messagesRef={messagesRef}
        setInput={setInput}
      />
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
    </div>
  );
}

function Messages({
  error,
  setInput,
  inputId,
  isTyping,
  messages,
  messagesRef,
}: {
  error?: Error;
  setInput: (input: string) => void;
  inputId: string;
  isTyping: boolean;
  messages: UIMessage[];
  messagesRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="flex flex-1 flex-col gap-4 overflow-y-auto p-6 mx-auto w-full justify-end mt-2"
      ref={messagesRef}
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          setInput={setInput}
          inputId={inputId}
          messagesRef={messagesRef}
        />
      ))}

      <TypingIndicator isTyping={isTyping} />
      <ErrorNotice error={error} />
    </div>
  );
}

function MessageBubble({
  inputId,
  message,
  messagesRef,
  setInput,
}: {
  inputId: string;
  message: UIMessage;
  messagesRef: RefObject<HTMLDivElement | null>;
  setInput: (input: string) => void;
}) {
  const isUser = message.role === "user";
  return isUser ? (
    <div className="chat chat-end prose">
      <div className="chat-bubble chat-bubble-accent">
        {message.parts.map((part) => (part.type === "text" ? part.text : null))}
      </div>
    </div>
  ) : (
    <ResponseMessage
      askQuestion={askQuestion}
      setInput={setInput}
      inputId={inputId}
      message={message}
      messagesRef={messagesRef}
    />
  );
}

function TypingIndicator({ isTyping }: { isTyping: boolean }) {
  return isTyping ? (
    <div className="flex justify-start">
      <div className="bg-white px-4 py-4 rounded-lg">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
        </div>
      </div>
    </div>
  ) : null;
}

function ErrorNotice({ error }: { error?: Error }) {
  return error ? (
    <div className="text-red-500 p-4">
      {error.message || "Some error happened"}
    </div>
  ) : null;
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
