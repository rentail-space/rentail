/** biome-ignore-all lint/a11y/noAutofocus: User needs to focus on input field */
import { useChat } from "@ai-sdk/react";
import type { LanguageModelUsage, Message } from "ai";
import {
  type ChangeEvent,
  type FormEvent,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Markdown from "react-markdown";
import {
  data,
  type LoaderFunctionArgs,
  useLoaderData,
  useSearchParams,
} from "react-router";
import { createMarkdownComponents } from "~/components/chat/MarkdownComponents";
import { commitSession, getSession } from "~/sessions.server";
import precanned from "../lib/precanned.md?raw";
import welcome from "../lib/welcome.md?raw";

type UserInfo = {
  name: string;
  location: string;
  level: string;
  interactions: number;
  rented: number;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const interactions = (session.get("interactions") || 0) + 1;
  session.set("interactions", interactions);
  const userInfo = {
    interactions,
    name: "Assaf",
    location: "Los Angeles, CA",
    level: "Expert",
    rented: 2,
  } as UserInfo;
  return data(
    { userInfo },
    { headers: { "Set-Cookie": await commitSession(session) } },
  );
}

export default function Chat() {
  const { userInfo } = useLoaderData<typeof loader>();
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const [usage, setUsage] = useState(new Map<string, LanguageModelUsage>());
  const [canEdit, setCanEdit] = useState(true);

  const {
    append,
    error,
    handleInputChange,
    handleSubmit,
    input,
    messages,
    status,
  } = useChat({
    api: "/api/chat",
    initialMessages: [{ content: welcome, id: "0", role: "assistant" }],
    onFinish: (message, options) => {
      setUsage((prev) => prev.set(message.id, options.usage));
      setCanEdit(true);
    },
  });

  const isTyping = status === "submitted";
  const initialQuery = searchParams.get("q");

  // Handle initial query from URL
  // biome-ignore lint/correctness/useExhaustiveDependencies: only once on mount
  useEffect(() => {
    if (initialQuery && messages.length === 1) {
      append({ content: initialQuery, role: "user" });
    }
  }, []);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleSubmit(event);
      setSearchParams((prev) => ({ ...prev, q: input.trim() }));
      setCanEdit(false);
    },
    [handleSubmit, setSearchParams, input],
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header userInfo={userInfo} />
      <Messages
        error={error}
        handleInputChange={handleInputChange}
        inputId={inputId}
        isTyping={isTyping}
        messages={messages}
        messagesRef={messagesRef}
        usage={usage}
      />
      <InputForm
        canEdit={canEdit}
        handleInputChange={handleInputChange}
        input={input}
        inputId={inputId}
        isTyping={isTyping}
        onSubmit={onSubmit}
      />
    </div>
  );
}

function Header({ userInfo }: { userInfo: UserInfo }) {
  return (
    <header className="bg-white border-b px-6 py-4 flex flex-row gap-8 items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">
        <span className="text-blue-600">rentail</span>.space
      </h1>
      <div className="flex flex-row gap-3 items-center">
        {userInfo.name && <HeaderStats label="User" value={userInfo.name} />}
        {userInfo.location && (
          <HeaderStats label="Location" value={userInfo.location} />
        )}
        {userInfo.level && <HeaderStats label="Level" value={userInfo.level} />}
        <HeaderStats
          label="Interactions"
          value={(userInfo.interactions || 0).toString()}
        />
        <HeaderStats label="Rented" value={(userInfo.rented || 0).toString()} />
      </div>
    </header>
  );
}

function HeaderStats({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-sm text-gray-500">
      {label}: <b>{value}</b>
    </span>
  );
}

type MessagesProps = {
  error?: Error;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  isTyping: boolean;
  messages: Message[];
  messagesRef: RefObject<HTMLDivElement | null>;
  usage: Map<string, LanguageModelUsage>;
};

function Messages({
  error,
  handleInputChange,
  inputId,
  isTyping,
  messages,
  messagesRef,
  usage,
}: MessagesProps) {
  const precanredQuestions = useMemo(
    () => precanned.split(/\n+/).filter((question) => question.trim()),
    [],
  );

  return (
    <div
      className="flex flex-1 flex-col overflow-y-auto p-6 space-y-4 mx-auto w-full"
      ref={messagesRef}
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          usage={usage.get(message.id)}
          handleInputChange={handleInputChange}
          inputId={inputId}
          messagesRef={messagesRef}
        />
      ))}

      <TypingIndicator isTyping={isTyping} />
      <ErrorNotice error={error} />
      <PrecannedQuestions
        handleInputChange={handleInputChange}
        inputId={inputId}
        questions={precanredQuestions}
        messagesRef={messagesRef}
      />
    </div>
  );
}

function MessageBubble({
  message,
  usage,
  handleInputChange,
  inputId,
  messagesRef,
}: {
  message: Message;
  usage?: LanguageModelUsage;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  messagesRef: RefObject<HTMLDivElement | null>;
}) {
  const isUser = message.role === "user";
  const bubbleStyles = isUser
    ? "bg-blue-600 text-white ml-auto"
    : "bg-white text-black border shadow-sm";
  const footerStyles = isUser ? "text-gray-300" : "text-gray-700";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-11/12 px-4 py-2 rounded-lg ${bubbleStyles}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <StructuredMessage
            message={message}
            handleInputChange={handleInputChange}
            inputId={inputId}
            messagesRef={messagesRef}
          />
        )}
        <div
          className={`my-2 text-sm flex flex-row gap-2 items-center ${footerStyles}`}
        >
          <MessageTimestamp timestamp={message.createdAt} />
          <TokenUsage usage={usage} />
        </div>
      </div>
    </div>
  );
}

function StructuredMessage({
  message,
  handleInputChange,
  inputId,
  messagesRef,
}: {
  message: Message;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  messagesRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <Markdown
      components={createMarkdownComponents({
        handleInputChange,
        inputId,
        messagesRef,
        askQuestion,
      })}
    >
      {message.content}
    </Markdown>
  );
}

function MessageTimestamp({ timestamp }: { timestamp?: Date }) {
  return (
    <span>
      {timestamp?.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  );
}

function TokenUsage({ usage }: { usage?: LanguageModelUsage }) {
  return (
    <span>
      {usage
        ? `Tokens: ${usage.promptTokens} (prompt) + ${usage.completionTokens} (completion) → ${usage.totalTokens}`
        : null}
    </span>
  );
}

function InputForm({
  canEdit,
  handleInputChange,
  input,
  inputId,
  isTyping,
  onSubmit,
}: {
  canEdit: boolean;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  input: string;
  inputId: string;
  isTyping: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  const isDisabled = isTyping || !canEdit;
  const canSubmit = !isDisabled && input.trim();

  return (
    <div className="bg-white border-t p-4 mx-auto w-full">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          autoFocus={true}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isDisabled}
          id={inputId}
          onChange={handleInputChange}
          placeholder="Ask about retail spaces..."
          spellCheck="false"
          type="text"
          value={input}
        />
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={!canSubmit}
          type="submit"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function TypingIndicator({ isTyping }: { isTyping: boolean }) {
  return isTyping ? (
    <div className="flex justify-start">
      <div className="bg-white border shadow-sm px-4 py-4 rounded-lg">
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

function PrecannedQuestions({
  handleInputChange,
  inputId,
  questions,
  messagesRef,
}: {
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  questions: string[];
  messagesRef: RefObject<HTMLDivElement | null>;
}) {
  const handleQuestionClick = useCallback(
    (question: string) => {
      askQuestion({ handleInputChange, inputId, question, messagesRef });
    },
    [handleInputChange, inputId, messagesRef],
  );

  return (
    <div className="mx-auto w-full flex flex-wrap gap-2">
      {questions.map((question) => (
        <button
          key={question}
          className="px-4 py-2 border-blue-300 hover:text-blue-700 hover:border-blue-700 border-1 rounded-lg transition-colors whitespace-nowrap"
          onClick={() => handleQuestionClick(question)}
          title="Click to ask this question"
          type="button"
        >
          Q: {question}
        </button>
      ))}
    </div>
  );
}

type AskQuestionParams = {
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  messagesRef: RefObject<HTMLDivElement | null>;
  question: string;
};

async function askQuestion({
  handleInputChange,
  inputId,
  question,
  messagesRef,
}: AskQuestionParams) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  if (!input) return;

  // Clear input and make it readonly during typing animation
  input.value = "";
  input.readOnly = true;
  handleInputChange({ target: input } as ChangeEvent<HTMLInputElement>);

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
  handleInputChange({ target: input } as ChangeEvent<HTMLInputElement>);
}
