import { useChat } from "@ai-sdk/react";
import type { Message } from "ai";
import {
  type ChangeEvent,
  type FormEvent,
  type RefObject,
  useRef,
} from "react";
import Markdown from "react-markdown";

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

const precanned = [
  "What are the available retail spaces?",
  "What is the average size of retail spaces?",
  "What are the rental prices for retail spaces?",
  "What are the lease terms for retail spaces?",
];

export default function () {
  const ref = useRef<HTMLDivElement>(null);
  const { error, handleInputChange, handleSubmit, input, messages, status } =
    useChat({ api: "/api/chat", initialMessages });
  const isTyping = status === "submitted";

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header />
      <Messages
        error={error}
        handleInputChange={handleInputChange}
        isTyping={isTyping}
        messages={messages}
        ref={ref}
      />
      <InputMessage
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        input={input}
        isTyping={isTyping}
      />
    </div>
  );
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
  handleInputChange,
  isTyping,
  messages,
  ref,
}: {
  error?: Error;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
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
                  a: ({ children }) => (
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={async () =>
                        await askQuestion({
                          handleInputChange,
                          question: `${children}`,
                          ref,
                        })
                      }
                      type="button"
                    >
                      {children}
                    </button>
                  ),
                  hr: () => <hr className="border-gray-300 my-2" />,
                  ol: ({ children }) => (
                    <ol className="ml-8 list-decimal">{children}</ol>
                  ),
                  p: ({ ...props }) => (
                    <p className="whitespace-pre-wrap my-2" {...props} />
                  ),
                  ul: ({ children }) => (
                    <ul className="ml-6 list-disc">{children}</ul>
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

      <div className="p-4 max-w-4xl mx-auto w-full flex flex-wrap gap-2">
        {precanned.map((question, index) => (
          <Precanned
            handleInputChange={handleInputChange}
            key={question}
            question={question}
            ref={ref}
          />
        ))}
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
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  input: string;
  isTyping: boolean;
}) {
  return (
    <div className="bg-white border-t p-4 max-w-4xl mx-auto w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          id="question"
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

function Precanned({
  handleInputChange,
  question,
  ref,
}: {
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  question: string;
  ref: RefObject<HTMLDivElement | null>;
}) {
  return (
    <button
      className="px-4 py-2 border-blue-300 hover:text-blue-700 hover:border-blue-700 border-1 rounded-lg transition-colors whitespace-nowrap"
      onClick={() => askQuestion({ handleInputChange, question, ref })}
      title="Click to ask this question"
      type="button"
    >
      Q: {question}
    </button>
  );
}

async function askQuestion({
  handleInputChange,
  question,
  ref,
}: {
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  ref: RefObject<HTMLDivElement | null>;
  question: string;
}) {
  const input = document.getElementById("question") as HTMLInputElement;
  input.value = "";
  input.readOnly = true;
  handleInputChange({ target: input } as ChangeEvent<HTMLInputElement>);

  // Auto-scroll to bottom when messages change
  if (ref.current)
    ref.current.scrollTo({
      behavior: "smooth",
      top: ref.current.scrollHeight,
    });
  input.focus();

  for (let i = 0; i < question.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    input.value += question[i];
  }
  input.readOnly = false;
  handleInputChange({ target: input } as ChangeEvent<HTMLInputElement>);
}
