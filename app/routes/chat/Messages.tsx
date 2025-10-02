import type { UIMessage, UITools } from "ai";
import { uniqBy } from "es-toolkit";
import React, { type JSX, useEffect, useRef, useState } from "react";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import {
  type ScrollToBottom,
  useStickToBottomContext,
} from "use-stick-to-bottom";
import askQuestion from "./askQuestion";

export default function Messages({
  error,
  inputRef,
  isTyping,
  messages,
  setQuery,
}: {
  error?: Error;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isTyping: boolean;
  messages: UIMessage<{ isAborted?: boolean }, { text: string }, UITools>[];
  setQuery: (query: string) => void;
}) {
  const prevMessagesLength = useRef(messages.length);
  const prevIsTyping = useRef(isTyping);

  const { scrollToBottom, isAtBottom } = useStickToBottomContext();
  // Auto-scroll when new messages arrive or typing state changes
  useEffect(() => {
    const messagesChanged = messages.length !== prevMessagesLength.current;
    const typingChanged = isTyping !== prevIsTyping.current;

    if (messagesChanged || typingChanged) {
      // Only auto-scroll if user was already at bottom or this is a new message
      if (isAtBottom || messagesChanged)
        // Use a small delay to ensure DOM has updated
        setTimeout(scrollToBottom, 10);
    }

    prevMessagesLength.current = messages.length;
    prevIsTyping.current = isTyping;
  }, [messages.length, isTyping, scrollToBottom, isAtBottom]);

  // Don't render the same message twice
  const uniqueMessages = uniqBy(messages, (message) => message.id);

  return (
    <div className="flex-1 flex flex-col">
      <div className="mx-auto flex max-w-3xl flex-1 flex-col justify-end gap-4 overflow-y-auto p-6 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {uniqueMessages.map((message, index, messages) =>
          message.metadata?.isAborted ? (
            <AbortedMessage key={message.id} />
          ) : message.role === "user" ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AssistantMessage
              askQuestion={askQuestion({ inputRef, scrollToBottom, setQuery })}
              isLast={index === messages.length - 1}
              key={message.id}
              message={message}
              scrollToBottom={scrollToBottom}
            />
          ),
        )}

        {isTyping && <TypingIndicator />}
        {error && <ErrorNotice error={error} />}
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: UIMessage }) {
  return (
    <div className="chat chat-end">
      <div className="chat-bubble chat-bubble-accent prose prose-base">
        {message.parts
          .filter((part) => part.type === "text")
          .map((part, index) => (
            <span key={index.toString()}>{part.text}</span>
          ))}
      </div>
    </div>
  );
}

function AbortedMessage() {
  return (
    <div className="chat chat-end">
      <div className="text-red-500">The conversation was aborted.</div>
    </div>
  );
}

function AssistantMessage({
  askQuestion,
  isLast,
  message,
  scrollToBottom,
}: {
  askQuestion: (question: string) => Promise<void>;
  isLast: boolean;
  message: UIMessage;
  scrollToBottom: ScrollToBottom;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll during streaming updates
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // Small delay to allow content to render
      setTimeout(scrollToBottom, 10);
    });

    if (contentRef.current) {
      observer.observe(contentRef.current, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, [scrollToBottom]);

  return message.parts.map((part, index, parts) => {
    switch (part.type) {
      case "text":
        return (
          <ResponseMessage
            askQuestion={askQuestion}
            contentRef={contentRef}
            key={index.toString()}
            text={part.text}
          />
        );
      case "reasoning":
        return (
          <ReasoningMessage
            isLast={isLast && index === parts.length - 1}
            key={index.toString()}
            text={part.text}
          />
        );
      default: {
        return null;
      }
    }
  });
}

function ReasoningMessage({ text, isLast }: { text: string; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isThinking = isLast;

  return (
    <details
      className="prose prose-base bg-gray-50 rounded-lg p-3 mb-2 hover:bg-gray-200"
      onToggle={(event) => setIsExpanded(event.currentTarget.open)}
      open={isExpanded}
    >
      <summary className="text-gray-600 font-medium cursor-pointer w-full mb-4">
        {isThinking ? (
          <span className="flex-row items-center gap-2 flex-nowrap pl-2">
            <ThinkingIcon />
            Thinking …
          </span>
        ) : isExpanded ? (
          "Reasoning"
        ) : (
          "Reasoning (click to expand)"
        )}
      </summary>
      <Streamdown
        allowedImagePrefixes={["*"]}
        allowedLinkPrefixes={["*"]}
        className="prose prose-base"
      >
        {text}
      </Streamdown>
    </details>
  );
}

function ResponseMessage({
  askQuestion,
  contentRef,
  text,
}: {
  askQuestion: (question: string) => Promise<void>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  text: string;
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
        <div ref={contentRef}>
          <Streamdown
            allowedImagePrefixes={["*"]}
            allowedLinkPrefixes={["*"]}
            components={getComponents({ askQuestion })}
            defaultOrigin="https://rentail.space"
            rehypePlugins={[]}
            remarkPlugins={[remarkGfm]}
          >
            {text}
          </Streamdown>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="rounded-lg bg-white px-4 py-4">
      <div className="flex space-x-1">
        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.1s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.2s]" />
      </div>
    </div>
  );
}

function ErrorNotice({ error }: { error: Error }) {
  return (
    <div className="p-4 text-red-500">
      {error.message || "Some error happened"}
    </div>
  );
}

function getComponents({
  askQuestion,
}: {
  askQuestion: (question: string) => Promise<void>;
}): {
  [Key in keyof JSX.IntrinsicElements]?: React.ComponentType<
    JSX.IntrinsicElements[Key]
  >;
} {
  return {
    ol: ({ children, className, ...props }) => (
      <ol className={"ml-4 list-outside list-decimal"} {...props}>
        {children}
      </ol>
    ),
    li: ({ children, className, ...props }) => (
      <li className={"py-1"} {...props}>
        {children}
      </li>
    ),
    ul: ({ children, className, ...props }) => (
      <ul className={"ml-4 list-outside list-disc"} {...props}>
        {children}
      </ul>
    ),
    strong: ({ children, className, ...props }) => (
      <span className={"font-semibold"} {...props}>
        {children}
      </span>
    ),
    a: ({ children, className, ...props }) => {
      const isAsk =
        props.href?.startsWith("https://rentail.space/") ||
        props.href?.startsWith("/");
      return isAsk ? (
        <a
          className="btn btn-soft btn-primary"
          href={`?q=${children}`}
          onClick={(event) => {
            event.preventDefault();
            askQuestion(React.Children.toArray(children).join(""));
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
    button: ({ children, className, ...props }) => (
      <button className="btn btn-soft btn-primary" {...props}>
        {children}
      </button>
    ),
    h1: ({ children, className, ...props }) => (
      <h1 className={"mt-6 mb-2 font-semibold text-xl"} {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, className, ...props }) => (
      <h2 className={"mt-6 mb-2 font-semibold text-lg"} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, className, ...props }) => (
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

function ThinkingIcon() {
  return (
    <svg
      aria-hidden="true"
      className="inline w-4 h-4 mr-2 text-gray-400 animate-spin"
      fill="none"
      role="progressbar"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        fill="currentColor"
      />
    </svg>
  );
}
