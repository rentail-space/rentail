import { useChat } from "@ai-sdk/react";
import type { CreateMessage, Message } from "ai";
import { useEffect } from "react";
import Markdown from "react-markdown";
import {
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
  useAppendQuestion({ append, searchParams, setSearchParams });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <Messages isTyping={isTyping} messages={messages} />
      {error && (
        <div className="text-red-500">
          {error.message || "Some error happened"}
        </div>
      )}
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
  searchParams,
  setSearchParams,
}: {
  append: (message: Message | CreateMessage) => void;
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
    }
  }, [searchParams, setSearchParams, append]);
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
  isTyping,
  messages,
}: {
  isTyping: boolean;
  messages: Message[];
}) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
      {/* Messages Container  */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                      />
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
            <div className="bg-white border shadow-sm px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
      </div>
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
    <div className="bg-white border-t p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about retail spaces..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={isTyping || !input.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
