import type { UIMessage } from "ai";
import type React from "react";
import { type JSX, useEffect, useMemo, useRef } from "react";
import { Button } from "react-email";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import { twMerge } from "tailwind-merge";
import type { ScrollToBottom } from "use-stick-to-bottom";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { Card, CardContent } from "~/components/ui/Card";
import { trackEvent } from "~/lib/useAnalytics";
import { maskWorkingMemoryTags } from "~/lib/workingMemory";

export default function ResponseMessage({
  askQuestion,
  isStreaming,
  message,
  scrollToBottom,
}: {
  askQuestion: (question: string) => Promise<void>;
  isStreaming: boolean;
  message: UIMessage;
  scrollToBottom: ScrollToBottom;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll during streaming updates
  useEffect(() => {
    if (!isStreaming) return;
    setTimeout(scrollToBottom, 10);
  }, [scrollToBottom, message.parts, isStreaming]);

  // Memoize components to prevent re-creating on every render
  const components = useMemo(
    () => getComponents({ askQuestion }),
    [askQuestion],
  );

  return message.parts.map((part, index) => {
    switch (part.type) {
      case "text": {
        return (
          <MarkdownMessage
            components={components}
            contentRef={contentRef}
            isStreaming={isStreaming}
            key={index.toString()}
            text={part.text}
          />
        );
      }
      // Other part types (reasoning, tool-invocation, source, file, data, step-start)
      // are rendered by the AI SDK's built-in UI and are intentionally skipped here.
      default:
        return null;
    }
  });
}

function MarkdownMessage({
  components,
  contentRef,
  isStreaming,
  text,
}: {
  components: ReturnType<typeof getComponents>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  isStreaming: boolean;
  text: string;
}) {
  return (
    <div
      className={twMerge(
        "chat-bubble-response",
        "flex max-w-9/10 flex-row gap-2",
      )}
    >
      <div className="not-typeset row-span-2 min-w-10 self-end">
        <img
          alt="rental space"
          height="40px"
          src="/favicon-96x96.png"
          width="40px"
          className="rounded-md border-2 border-black shadow-[2px_2px_0px_0px_black]"
        />
      </div>
      <Card
        className="rounded-bl-none bg-[hsl(120,100%,97%)] py-2"
        ref={contentRef}
      >
        <CardContent>
          <Streamdown
            caret="block"
            className="typeset typeset-chat max-w-none"
            components={components}
            controls={{ code: false, mermaid: false, table: false }}
            isAnimating={isStreaming}
            mode={isStreaming ? "streaming" : "static"}
            parseIncompleteMarkdown
            remarkPlugins={[remarkGfm]}
          >
            {maskWorkingMemoryTags(text)}
          </Streamdown>
        </CardContent>
      </Card>
    </div>
  );
}

function getComponents({
  askQuestion,
}: {
  askQuestion: (question: string) => Promise<void>;
}): {
  [Key in keyof JSX.IntrinsicElements]?: React.ComponentType<
    JSX.IntrinsicElements[Key]
  >;
} {
  return {
    a: ({ children, href }) => {
      const question = getAskQuestionFromHref(href);
      return question ? (
        <ActiveLink
          to={`/chat?q=${encodeURIComponent(question)}`}
          onClick={(event) => {
            event.preventDefault();
            void askQuestion(question);
            trackEvent("click_ask_question", { category: "chat" });
          }}
        >
          {children}
        </ActiveLink>
      ) : (
        <ActiveLink
          onClick={() =>
            trackEvent("click_external_link", { category: "chat" })
          }
          target="_blank"
          to={href ?? ""}
        >
          {children}
        </ActiveLink>
      );
    },
    button: ({ children }) => (
      <Button className="inline-block">{children}</Button>
    ),
  };
}

function getAskQuestionFromHref(href: string | undefined): string | null {
  if (!href?.startsWith("/?q=")) return null;

  const question = new URL(href, "https://rentail.space").searchParams.get("q");
  return question?.trim() || null;
}
