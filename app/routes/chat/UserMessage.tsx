import type { UIMessage } from "ai";
import { twMerge } from "tailwind-merge";
import { Card, CardContent } from "~/components/ui/Card";

export default function UserMessage({ message }: { message: UIMessage }) {
  // NOTE: always render as plain text to avoid HTML injection
  const multipleLines = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .split("\n");

  return (
    <div
      className={twMerge(
        "chat-bubble-user",
        "flex w-full flex-row justify-end",
      )}
    >
      <Card
        className={twMerge(
          "max-w-9/10 rounded-tr-none bg-[hsl(47,100%,95%)] py-2",
        )}
      >
        <CardContent className="prose prose-base">
          {multipleLines.map((line, index) => (
            <p key={index.toString()}>{line}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
