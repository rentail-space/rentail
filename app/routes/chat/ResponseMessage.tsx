import type { Message } from "ai";
import type { ChangeEvent, RefObject } from "react";
import Markdown from "react-markdown";

export default function ResponseMessage({
  message,
  handleInputChange,
  inputId,
  messagesRef,
  askQuestion,
}: {
  message: Message;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  messagesRef: RefObject<HTMLDivElement | null>;
  askQuestion: (params: {
    handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
    inputId: string;
    question: string;
    messagesRef: RefObject<HTMLDivElement | null>;
  }) => Promise<void>;
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
            handleInputChange,
            inputId,
            messagesRef,
            askQuestion,
          })}
        >
          {message.content}
        </Markdown>
      </div>
    </div>
  );
}

function createMarkdownComponents({
  handleInputChange,
  inputId,
  messagesRef,
  askQuestion,
}: {
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  messagesRef: RefObject<HTMLDivElement | null>;
  askQuestion: (params: {
    handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
    inputId: string;
    question: string;
    messagesRef: RefObject<HTMLDivElement | null>;
  }) => Promise<void>;
}) {
  return {
    a: ({ children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        className="btn btn-soft btn-primary"
        href={`?q=${children}`}
        onClick={async (event) => {
          event.preventDefault();
          await askQuestion({
            handleInputChange,
            inputId,
            question: `${children}`,
            messagesRef,
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
