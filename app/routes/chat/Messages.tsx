import type { TextUIPart, UIMessage } from "ai";
import type { RefObject } from "react";
import Response from "./Response";

export default function Messages({
  error,
  setInput,
  isSubmitting: isTyping,
  messages,
  messagesRef,
}: {
  error?: Error;
  setInput: (input: string) => void;
  isSubmitting: boolean;
  messages: UIMessage[];
  messagesRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="flex flex-1 flex-col gap-4 overflow-y-auto p-6 mx-auto max-w-3xl w-full justify-end mt-2"
      ref={messagesRef}
    >
      {messages.map((message, index) =>
        message.role === "user" ? (
          <UserMessage key={index.toString()} message={message} />
        ) : (
          <ResponseMessage
            setInput={setInput}
            key={index.toString()}
            message={message}
          />
        ),
      )}

      <TypingIndicator isTyping={isTyping} />
      <ErrorNotice error={error} />
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

function ResponseMessage({
  setInput,
  message,
}: {
  setInput: (input: string) => void;
  message: UIMessage;
}) {
  return (
    <div className="chat chat-start">
      <div className="chat-image avatar w-8 h-8 mr-2">
        <img
          alt="rental space"
          height="32px"
          src="/favicon-96x96.png"
          width="32px"
        />
      </div>
      <div className="chat-bubble prose prose-base">
        <Response setInput={setInput}>
          {message.parts.map((part) => (part as TextUIPart).text).join("")}
        </Response>
      </div>
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
