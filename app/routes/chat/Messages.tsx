import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { BeatLoading } from "respinner";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { cn } from "~/lib/utils";
import askQuestion from "~/routes/chat/askQuestion";
import ErrorMessage from "./ErrorMessage";
import ResponseMessage from "./ResponseMessage";
import UserMessage from "./UserMessage";

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
  // biome-ignore lint/correctness/useExhaustiveDependencies: on first render
  useEffect(() => {
    if (!isAtBottom) scrollToBottom();
  }, []);

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
    <div
      className={cn(
        "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent overflow-y-auto scroll-smooth",
        "mx-auto flex min-h-full max-w-3xl p-4",
        "flex flex-col justify-end gap-4",
      )}
    >
      {messages.map((message, index) =>
        message.role === "user" ? (
          <UserMessage key={message.id} message={message} />
        ) : message.role === "assistant" ? (
          <ResponseMessage
            askQuestion={askQuestion({ scrollToBottom, setQuery })}
            isStreaming={index === messages.length - 1 && isTyping}
            key={message.id}
            message={message}
            scrollToBottom={scrollToBottom}
          />
        ) : null,
      )}

      {isTyping && <BeatLoading color="lightblue" count={4} />}
      {error && <ErrorMessage error={error} />}
      {isAborted && (
        <ErrorMessage error={new Error("The conversation was aborted.")} />
      )}
    </div>
  );
}
