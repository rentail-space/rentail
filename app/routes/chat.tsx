/** biome-ignore-all lint/a11y/noAutofocus: User needs to focus on input field */
import { useChat } from "@ai-sdk/react";
import type { Message } from "ai";
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
import userData from "../data/users.json";
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
    ...userData.defaultUser,
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
    onFinish: () => {
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
      return false;
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
      />
      <InputForm
        canEdit={canEdit}
        handleInputChange={handleInputChange}
        input={input}
        inputId={inputId}
        isTyping={isTyping}
        onSubmit={onSubmit}
      />
      <PrecannedQuestions
        handleInputChange={handleInputChange}
        inputId={inputId}
        messagesRef={messagesRef}
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

function Messages({
  error,
  handleInputChange,
  inputId,
  isTyping,
  messages,
  messagesRef,
}: {
  error?: Error;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  isTyping: boolean;
  messages: Message[];
  messagesRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="flex flex-1 flex-col overflow-y-auto p-6 space-y-4 mx-auto w-full justify-end"
      ref={messagesRef}
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          handleInputChange={handleInputChange}
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
  const isUser = message.role === "user";
  const bubbleStyles = isUser
    ? "bg-indigo-200 text-gray-800 ml-auto"
    : "bg-white text-gray-800";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-3xl font-medium max-w-11/12 p-4 ${bubbleStyles}`}
      >
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
  const buttonColor = canSubmit
    ? "bg-indigo-500 hover:bg-indigo-600"
    : "bg-indigo-300";
  const shrinkButton = canSubmit
    ? "transition-all duration-200 active:scale-[0.6] active:duration-75 cursor-pointer active:scale-95 hover:scale-105 "
    : "";

  return (
    <div className="bg-gray-50 p-2 flex justify-center items-center w-full">
      <form onSubmit={onSubmit} className="relative w-full">
        <input
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          autoFocus={true}
          className="w-full py-4 pl-5 pr-16 border-2 border-gray-200 rounded-2xl text-base outline-none transition-all duration-200 bg-white placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          disabled={isDisabled}
          id={inputId}
          onChange={handleInputChange}
          placeholder="Ask about retail spaces..."
          spellCheck="false"
          type="text"
          value={input}
        />
        <button
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 border-none rounded-xl w-10 h-10 flex items-center justify-center ${buttonColor} ${shrinkButton}`}
          disabled={!canSubmit}
          type="submit"
        >
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <title>Send arrow</title>
            <path
              d="M12 2L12 22M5 9L12 2L19 9"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              stroke="white"
            />
          </svg>
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
  messagesRef,
}: {
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  messagesRef: RefObject<HTMLDivElement | null>;
}) {
  const questions = useMemo(
    () => precanned.split(/\n+/).filter((question) => question.trim()),
    [],
  );
  const handleQuestionClick = useCallback(
    (question: string) => {
      askQuestion({ handleInputChange, inputId, question, messagesRef });
    },
    [handleInputChange, inputId, messagesRef],
  );

  return (
    <div className="mx-auto overflow-x-auto overflow-y-hidden w-full p-2">
      <div className="text-white text-xs font-bold flex flex-row gap-2">
        {questions.map((question) => (
          <button
            key={question}
            className="bg-gray-200 rounded-3xl p-2 font-medium text-gray-800 hover:bg-gray-300 hover:underline"
            onClick={() => handleQuestionClick(question)}
            title="Click to ask this question"
            type="button"
          >
            Q: {question}
          </button>
        ))}
      </div>
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
