import type { TextUIPart, UIMessage } from "ai";
import Response from "./Response";

export default function MessageBubble({
  setInput,
  message,
  inputRef,
}: {
  setInput: (input: string) => void;
  message: UIMessage;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const isUser = message.role === "user";
  return isUser ? (
    <UserMessage message={message} />
  ) : (
    <ResponseMessage
      setInput={setInput}
      message={message}
      inputRef={inputRef}
    />
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
