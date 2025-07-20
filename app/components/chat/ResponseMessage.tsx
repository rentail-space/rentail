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
    <div className="flex flex-row gap-2">
      <img
        alt="rental space"
        className="w-8 h-8 rounded-md border-2 border-gray-200"
        height={32}
        src="/logo.png"
        width={32}
      />
      <div className="flex flex-col gap-2">
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
