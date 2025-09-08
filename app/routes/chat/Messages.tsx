import type { UIMessage } from "ai";
import React from "react";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import { useStickToBottomContext } from "use-stick-to-bottom";
import askQuestion from "./askQuestion";

export default function Messages({
  error,
  isSubmitting: isTyping,
  messages,
  inputRef,
}: {
  error?: Error;
  isSubmitting: boolean;
  messages: UIMessage[];
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { scrollToBottom } = useStickToBottomContext();

  return (
    <div className="flex-1 flex flex-col">
      <div className="mx-auto flex max-w-3xl flex-1 flex-col justify-end gap-4 overflow-y-auto p-6">
        <FirstMessage />

        {messages.map((message, index) =>
          message.role === "user" ? (
            <UserMessage key={index.toString()} message={message} />
          ) : (
            <ResponseMessage
              inputRef={inputRef}
              key={index.toString()}
              message={message}
              scrollToBottom={scrollToBottom}
            />
          ),
        )}

        <TypingIndicator isTyping={isTyping} />
        <ErrorNotice error={error} />
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: UIMessage }) {
  return (
    <div className="chat chat-end">
      <div className="chat-bubble chat-bubble-accent prose prose-base">
        {message.parts.map((part, index) =>
          part.type === "text" ? (
            <span key={index.toString()}>{part.text}</span>
          ) : null,
        )}
      </div>
    </div>
  );
}

function FirstMessage() {
  return (
    <div className="chat chat-start">
      <div className="chat-image avatar mr-2 h-8 w-8">
        <img
          alt="rental space"
          height="32px"
          src="/favicon-96x96.png"
          width="32px"
        />
      </div>
      <div className="chat-bubble prose prose-base flex flex-row">
        <p>
          Hello, I'm <strong>Rentail</strong> — how can I help you find a pop-up
          retail space for your business?
        </p>
      </div>
    </div>
  );
}

function ResponseMessage({
  message,
  inputRef,
  scrollToBottom,
}: {
  message: UIMessage;
  inputRef: React.RefObject<HTMLInputElement | null>;
  scrollToBottom: () => void;
}) {
  return (
    <div className="chat chat-start">
      <div className="chat-image avatar mr-2 h-8 w-8">
        <img
          alt="rental space"
          height="32px"
          src="/favicon-96x96.png"
          width="32px"
        />
      </div>
      <div className="chat-bubble prose prose-base">
        <div>
          {message.parts
            .filter((part) => part.type === "text")
            .map((part, index) => (
              <Streamdown
                allowedImagePrefixes={["*"]}
                allowedLinkPrefixes={["*"]}
                components={getComponents({ inputRef, scrollToBottom })}
                defaultOrigin="https://rentail.space"
                key={index.toString()}
                rehypePlugins={[]}
                remarkPlugins={[remarkGfm]}
              >
                {part.text}
              </Streamdown>
            ))}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ isTyping }: { isTyping: boolean }) {
  return isTyping ? (
    <div className="flex justify-start">
      <div className="rounded-lg bg-white px-4 py-4">
        <div className="flex space-x-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.1s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.2s]" />
        </div>
      </div>
    </div>
  ) : null;
}

function ErrorNotice({ error }: { error?: Error }) {
  return error ? (
    <div className="p-4 text-red-500">
      {error.message || "Some error happened"}
    </div>
  ) : null;
}

function getComponents({
  inputRef,
  scrollToBottom,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  scrollToBottom: () => void;
}): Components {
  return {
    ol: ({ node, children, className, ...props }) => (
      <ol className={"ml-4 list-outside list-decimal"} {...props}>
        {children}
      </ol>
    ),
    li: ({ node, children, className, ...props }) => (
      <li className={"py-1"} {...props}>
        {children}
      </li>
    ),
    ul: ({ node, children, className, ...props }) => (
      <ul className={"ml-4 list-outside list-disc"} {...props}>
        {children}
      </ul>
    ),
    strong: ({ node, children, className, ...props }) => (
      <span className={"font-semibold"} {...props}>
        {children}
      </span>
    ),
    a: ({ node, children, className, ...props }) => {
      const isAsk = props.href?.startsWith("https://rentail.space");
      return isAsk ? (
        <a
          className="btn btn-soft btn-primary"
          href={`?q=${children}`}
          onClick={async (event) => {
            event.preventDefault();
            await askQuestion({
              question: React.Children.toArray(children),
              scrollToBottom,
              inputRef,
            });
          }}
        >
          {children}
        </a>
      ) : (
        <a className="link-primary" href={props.href} target="_blank">
          {children}
        </a>
      );
    },
    button: ({ node, children, className, ...props }) => (
      <button className="btn btn-soft btn-primary" {...props}>
        {children}
      </button>
    ),
    h1: ({ node, children, className, ...props }) => (
      <h1 className={"mt-6 mb-2 font-semibold text-xl"} {...props}>
        {children}
      </h1>
    ),
    h2: ({ node, children, className, ...props }) => (
      <h2 className={"mt-6 mb-2 font-semibold text-lg"} {...props}>
        {children}
      </h2>
    ),
    h3: ({ node, children, className, ...props }) => (
      <h3 className={"mt-6 mb-2 font-semibold text-md"} {...props}>
        {children}
      </h3>
    ),
    hr: () => <hr className="border-gray-300" />,
    p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="mt-2 mb-2 whitespace-pre-wrap">{children}</p>
    ),
  };
}
