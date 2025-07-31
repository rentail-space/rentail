import type { UIMessage } from "@ai-sdk/react";
import type { RefObject } from "react";
import Markdown from "react-markdown";

export default function ResponseMessage({
  askQuestion,
  inputId,
  message,
  messagesRef,
  setInput,
}: {
  askQuestion: (params: {
    setInput: (input: string) => void;
    inputId: string;
    question: string;
    messagesRef: RefObject<HTMLDivElement | null>;
  }) => Promise<void>;
  inputId: string;
  message: UIMessage;
  messagesRef: RefObject<HTMLDivElement | null>;
  setInput: (input: string) => void;
}) {
  return (
    <div className="chat chat-start ">
      <div className="chat-image avatar w-8 h-8 mr-2">
        <img
          alt="rental space"
          height="32px"
          src="/favicon-96x96.png"
          width="32px"
        />
      </div>
      <div className="chat-bubble prose prose-base">
        <Markdown
          components={createMarkdownComponents({
            askQuestion,
            inputId,
            messagesRef,
            setInput,
          })}
        >
          {message.parts
            .map((part) => (part.type === "text" ? part.text : null))
            .join("")}
        </Markdown>
      </div>
    </div>
  );
}

function createMarkdownComponents({
  askQuestion,
  inputId,
  messagesRef,
  setInput,
}: {
  askQuestion: (params: {
    inputId: string;
    messagesRef: RefObject<HTMLDivElement | null>;
    question: string;
    setInput: (input: string) => void;
  }) => Promise<void>;
  inputId: string;
  messagesRef: RefObject<HTMLDivElement | null>;
  setInput: (input: string) => void;
}) {
  return {
    a: ({ children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        className="btn btn-soft btn-primary"
        href={`?q=${children}`}
        onClick={async (event) => {
          event.preventDefault();
          await askQuestion({
            inputId,
            messagesRef,
            question: `${children}`,
            setInput,
          });
        }}
      >
        {children}
      </a>
    ),
    h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className="text-xl font-bold">{children}</h1>
    ),
    h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className="text-lg font-semibold">{children}</h2>
    ),
    h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="text-md font-semibold">{children}</h3>
    ),
    hr: () => <hr className="border-gray-300" />,
    ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="ml-8 list-decimal">{children}</ol>
    ),
    p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="whitespace-pre-wrap mt-2 mb-2">{children}</p>
    ),
    ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="ml-6 list-disc">{children}</ul>
    ),
  };
}
