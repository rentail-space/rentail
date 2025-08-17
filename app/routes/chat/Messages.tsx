import type { TextUIPart, UIMessage } from "ai";
import Response from "./Response";

export default function Messages({
  className,
  error,
  setInput,
  isSubmitting: isTyping,
  messages,
  inputRef,
}: {
  className?: string;
  error?: Error;
  setInput: (input: string) => void;
  isSubmitting: boolean;
  messages: UIMessage[];
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className={`flex-1 flex flex-col ${className || ""}`}>
      <div className="mx-auto flex max-w-3xl flex-1 flex-col justify-end gap-4 overflow-y-auto p-6">
        {messages.map((message, index) =>
          message.role === "user" ? (
            <UserMessage key={index.toString()} message={message} />
          ) : (
            <ResponseMessage
              setInput={setInput}
              key={index.toString()}
              message={message}
              inputRef={inputRef}
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

function ResponseMessage({
  setInput,
  message,
  inputRef,
}: {
  setInput: (input: string) => void;
  message: UIMessage;
  inputRef: React.RefObject<HTMLInputElement | null>;
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
        <Response setInput={setInput} inputRef={inputRef}>
          {message.parts.map((part) => (part as TextUIPart).text).join("")}
        </Response>
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
