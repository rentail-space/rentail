import type { UIMessage } from "ai";
import type { RefObject } from "react";
import MessageBubble from "./MessageBubble";

export default function Messages({
  error,
  setInput,
  inputId,
  isTyping,
  messages,
  messagesRef,
  askQuestion,
}: {
  error?: Error;
  setInput: (input: string) => void;
  inputId: string;
  isTyping: boolean;
  messages: UIMessage[];
  messagesRef: RefObject<HTMLDivElement | null>;
  askQuestion: (params: {
    setInput: (input: string) => void;
    inputId: string;
    question: string;
    messagesRef: RefObject<HTMLDivElement | null>;
  }) => Promise<void>;
}) {
  return (
    <div
      className="flex flex-1 flex-col gap-4 overflow-y-auto p-6 mx-auto max-w-3xl w-full justify-end mt-2"
      ref={messagesRef}
    >
      {messages.map((message, index) => (
        <MessageBubble
          askQuestion={askQuestion}
          inputId={inputId}
          key={index.toString()}
          message={message}
          messagesRef={messagesRef}
          setInput={setInput}
        />
      ))}

      <TypingIndicator isTyping={isTyping} />
      <ErrorNotice error={error} />
    </div>
  );
}

function TypingIndicator({ isTyping }: { isTyping: boolean }) {
  return isTyping ? (
    <div className="flex justify-start">
      <div className="bg-white px-4 py-4 rounded-lg">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
        </div>
      </div>
    </div>
  ) : null;
}

function ErrorNotice({ error }: { error?: Error }) {
  return error ? (
    <div className="text-red-500 p-4">
      {error.message || "Some error happened"}
    </div>
  ) : null;
}
