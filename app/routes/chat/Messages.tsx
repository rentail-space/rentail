import { useEffect, useRef } from "react";
import { BeatLoading } from "respinner";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { cn } from "~/lib/utils";
import askQuestion from "~/routes/chat/askQuestion";
import ResponseMessage from "./ResponseMessage";
import type { UIMessage } from "ai";

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

      {isTyping && <BeatLoading color="lightblue" count={4} />}
      {isAborted && <Aborted />}
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
    <div className={cn("chat-bubble-user", "flex w-full flex-row justify-end")}>
      <div
        className={cn(
          "max-w-9/10 rounded-b-md rounded-tl-md border-2 border-black bg-[hsl(47,100%,95%)] shadow-[4px_4px_0px_0px_black]",
          "prose prose-base px-4 py-3 font-medium text-black",
        )}
      >
        {multipleLines.map((line, index) => (
          <p key={index.toString()}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function Aborted() {
  return (
    <div className="chat chat-end">
      <div className="rounded-md border-2 border-black bg-red-100 px-4 py-3 font-bold text-black shadow-[4px_4px_0px_0px_black]">
        The conversation was aborted.
      </div>
    </div>
  );
}

function ErrorNotice({ error }: { error: Error }) {
  return (
    <div className="rounded-md border-2 border-black bg-red-100 p-4 font-bold text-black shadow-[4px_4px_0px_0px_black]">
      {error.message || "Some error happened"}
    </div>
  );
}
