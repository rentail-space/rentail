import { useChat } from "@ai-sdk/react";
import type { CreateMessage, Message } from "ai";
import { type RefObject, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import {
  Link,
  NavLink,
  type SetURLSearchParams,
  useSearchParams,
} from "react-router";

const initialMessages: Message[] = [
  {
    content: `Welcome to **rentail.space**!
I'm your virtual assistant here to help you find the perfect retail space for your business needs.
How can I assist you today?
`,
    id: "0",
    role: "assistant",
  },
];

export default function () {
  const [searchParams, setSearchParams] = useSearchParams();
  const ref = useRef<HTMLDivElement>(null);
  const {
    error,
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    append,
  } = useChat({ api: "/api/chat", initialMessages });
  const isTyping = status === "submitted";
  useAppendQuestion({ append, ref, searchParams, setSearchParams });

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header />
      <Messages
        error={error}
        ref={ref}
        isTyping={isTyping}
        messages={messages}
      />
      <Presets />
      <InputMessage
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        input={input}
        isTyping={isTyping}
      />
    </div>
  );
}

function useAppendQuestion({
  append,
  ref,
  searchParams,
  setSearchParams,
}: {
  append: (message: Message | CreateMessage) => void;
  ref: RefObject<HTMLDivElement | null>;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
}) {
  useEffect(() => {
    const question = (searchParams.get("question") ?? "").trim();
    if (question) {
      // Send the question as a user message
      append({ role: "user", content: question.trim() });

      // Remove the question parameter from URL without reloading
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("question");
      setSearchParams(newSearchParams, { replace: true });

      // Auto-scroll to bottom when messages change
      setTimeout(() => {
        if (ref.current)
          ref.current.scrollTo({
            behavior: "smooth",
            top: ref.current.scrollHeight,
          });
      }, 100);
    }
  }, [append, ref, searchParams, setSearchParams]);
}

function Header() {
  return (
    <header className="bg-white border-b px-6 py-4">
      <h1 className="text-2xl font-bold text-gray-900">
        <span className="text-blue-600">rentail</span>.space
      </h1>
    </header>
  );
}

function Messages({
  error,
  isTyping,
  messages,
  ref,
}: {
  error?: Error;
  isTyping: boolean;
  messages: Message[];
  ref: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="flex flex-1 flex-col overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full"
      ref={ref}
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.role === "user"
                ? "bg-blue-600 text-white ml-auto"
                : "bg-white border shadow-sm"
            }`}
          >
            {message.role === "user" ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <Markdown
                components={{
                  a: ({ node, ...props }) => (
                    <NavLink
                      {...props}
                      className="text-blue-600 hover:underline"
                      to={props.href || "#"}
                      target={
                        props.href?.startsWith("http") ? "_blank" : undefined
                      }
                    />
                  ),
                  hr: ({ node, ...props }) => (
                    <hr className="border-gray-300 my-2" />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="whitespace-pre-wrap my-2" {...props} />
                  ),
                }}
              >
                {message.content}
              </Markdown>
            )}
            <div
              className={`text-xs mt-1 ${
                message.role === "user" ? "text-blue-100" : "text-gray-500"
              }`}
            >
              {message.createdAt?.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-white border shadow-sm px-4 py-4 rounded-lg">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-500 p-4">
          {error.message || "Some error happened"}
        </div>
      )}
    </div>
  );
}

function InputMessage({
  handleInputChange,
  handleSubmit,
  input,
  isTyping,
}: {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  input: string;
  isTyping: boolean;
}) {
  return (
    <div className="bg-white border-t p-4 max-w-4xl mx-auto w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          // biome-ignore lint/a11y/noAutofocus: <explanation>
          autoFocus
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isTyping}
          onChange={handleInputChange}
          placeholder="Ask about retail spaces..."
          spellCheck="false"
          type="text"
          value={input}
        />
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={isTyping || !input.trim()}
          type="submit"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Presets() {
  return (
    <div className="p-4 max-w-4xl mx-auto w-full flex flex-wrap gap-2">
      <Preset question="What is the average rent for retail spaces?" />
      <Preset question="What are the best locations for retail spaces?" />
      <Preset question="What amenities are included in retail spaces?" />
    </div>
  );
}

function Preset({
  question,
}: {
  question: string;
}) {
  return (
    <Link
      className="px-4 py-2 border-blue-300 hover:text-blue-700 hover:border-blue-700 border-1 rounded-lg transition-colors whitespace-nowrap"
      title="Click to ask this question"
      to={{ search: `?question=${question}` }}
    >
      Q: {question}
    </Link>
  );
}
