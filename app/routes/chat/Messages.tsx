import type { UIMessage, UITools } from "ai";
import { uniqBy } from "es-toolkit";
import { IconCircle } from "obra-icons-react";
import React, { type JSX, useEffect, useRef, useState } from "react";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import {
  type ScrollToBottom,
  useStickToBottomContext,
} from "use-stick-to-bottom";
import askQuestion from "~/routes/chat/askQuestion";

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
    <div className="flex flex-1 flex-col">
      <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent mx-auto flex max-w-3xl flex-1 flex-col justify-end gap-4 overflow-y-auto scroll-smooth p-6">
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
  // NOTE: always render as plain text to avoid HTML injection
  return (
    <div className="chat chat-end">
      <div className="chat-bubble chat-bubble-accent prose prose-base">
        {message.parts
          .filter((part) => part.type === "text")
          .map((part, index) => (
            <p key={index.toString()}>{part.text}</p>
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
      className="prose prose-base mb-2 rounded-lg bg-gray-50 p-3 hover:bg-gray-200"
      onToggle={(event) => setIsExpanded(event.currentTarget.open)}
      open={isExpanded}
    >
      <summary className="mb-4 w-full cursor-pointer font-medium text-gray-600">
        {isThinking ? (
          <span className="flex-row flex-nowrap items-center gap-2 pl-2">
            <IconCircle className="mr-2 inline-block h-4 w-4 animate-spin" />
            <span>Thinking…</span>
          </span>
        ) : isExpanded ? (
          "Reasoning"
        ) : (
          "Reasoning (click to expand)"
        )}
      </summary>
      <Streamdown
        className="prose prose-base"
        remarkPlugins={[[remarkGfm, {}]]}
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
            components={getComponents({ askQuestion })}
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
    a: ({ children, href }) => {
      const isAsk =
        href?.startsWith("https://rentail.space/") || href?.startsWith("/");
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
        <a className="link-primary" href={href} target="_blank">
          {children}
        </a>
      );
    },
    button: ({ children }) => (
      <button className="btn btn-soft btn-primary" type="button">
        {children}
      </button>
    ),
    h1: ({ children }) => (
      <h1 className={"mt-6 mb-2 font-semibold text-xl"}>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className={"mt-6 mb-2 font-semibold text-lg"}>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className={"mt-6 mb-2 font-semibold text-md"}>{children}</h3>
    ),
    hr: () => <hr className="border-gray-300" />,
    li: ({ children }) => <li className={"py-1"}>{children}</li>,
    ol: ({ children }) => (
      <ol className={"ml-4 list-outside list-decimal"}>{children}</ol>
    ),
    p: ({ children }) => (
      <p className="mt-2 mb-2 whitespace-pre-wrap">{children}</p>
    ),
    strong: ({ children }) => (
      <span className={"font-semibold"}>{children}</span>
    ),
    ul: ({ children }) => (
      <ul className={"ml-4 list-outside list-disc"}>{children}</ul>
    ),
  };
}
