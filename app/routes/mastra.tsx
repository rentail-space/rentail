import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

export default function () {
  const { messages } = useChat<UIMessage>({
    messages: [],
    resume: true, // Enable automatic stream resumption
    transport: new DefaultChatTransport({
      api: "/api/mastra",
    }),
  });

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => (
        <div key={message.id} className="chat chat-end">
          <div className="chat-bubble chat-bubble-accent">
            {message.parts
              .map((part) => (part.type === "text" ? part.text : ""))
              .join(" ")}
          </div>
        </div>
      ))}
    </div>
  );
}
