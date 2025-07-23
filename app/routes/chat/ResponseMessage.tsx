import type { Message } from "ai";
import type { ChangeEvent, RefObject } from "react";
import Markdown from "react-markdown";
import createMarkdownComponents from "./MarkdownComponents";

export default function ResponseMessage({
  message,
  handleInputChange,
  inputId,
  messagesRef,
  askQuestion,
}: {
  message: Message;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  messagesRef: RefObject<HTMLDivElement | null>;
  askQuestion: (params: {
    handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
    inputId: string;
    question: string;
    messagesRef: RefObject<HTMLDivElement | null>;
  }) => Promise<void>;
}) {
  return (
    <div className="chat chat-start ">
      <div className="chat-image avatar w-8 h-8 mr-2">
        <img alt="rental space" height="32px" src="/logo.png" width="32px" />
      </div>
      <div className="chat-bubble">
        <Markdown
          components={createMarkdownComponents({
            handleInputChange,
            inputId,
            messagesRef,
            askQuestion,
          })}
        >
          {message.content}
        </Markdown>
      </div>
    </div>
  );
}
