import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import askQuestion from "~/routes/chat/askQuestion";
import ResponseMessage from "./ResponseMessage";

export default function Messages({
  isAborted,
  error,
  isTyping,
  messages,
  setQuery,
}: {
  isAborted: boolean;
  error?: Error;
  isTyping: boolean;
  messages: UIMessage[];
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

  return (
    <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent mx-auto flex max-w-3xl flex-1 flex-col justify-end gap-4 overflow-y-auto scroll-smooth p-4">
      {messages.map((message) =>
        message.role === "user" ? (
          <UserMessage key={message.id} message={message} />
        ) : message.role === "assistant" ? (
          <ResponseMessage
            askQuestion={askQuestion({ scrollToBottom, setQuery })}
            isStreaming={isTyping}
            key={message.id}
            message={message}
            scrollToBottom={scrollToBottom}
          />
        ) : null,
      )}

      {isTyping && <TypingIndicator />}
      {isAborted && <_AbortedMessage />}
      {error && <ErrorNotice error={error} />}
    </div>
  );
}

function UserMessage({ message }: { message: UIMessage }) {
  // NOTE: always render as plain text to avoid HTML injection
  const multipleLines = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .split("\n");

  return (
    <div className="chat chat-end">
      <div className="chat-bubble chat-bubble-accent chat-bubble-user prose prose-base">
        {multipleLines.map((line, index) => (
          <p key={index.toString()}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function _AbortedMessage() {
  return (
    <div className="chat chat-end">
      <div className="text-red-500">The conversation was aborted.</div>
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
