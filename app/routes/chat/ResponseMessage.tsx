import type { UIMessage } from "ai";
import type React from "react";
import { Children, type JSX, useEffect, useRef } from "react";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import type { ScrollToBottom } from "use-stick-to-bottom";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { trackEvent } from "~/lib/analytics";
import { cn } from "~/lib/utils";
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
    const observer = new MutationObserver(() => {
      // Small delay to allow content to render
      setTimeout(scrollToBottom, 10);
    });

    if (contentRef.current) {
      observer.observe(contentRef.current, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, [scrollToBottom]);

  return message.parts.map((part, index) => {
    switch (part.type) {
      case "text": {
        return (
          <MarkdownMessage
            askQuestion={askQuestion}
            contentRef={contentRef}
            isStreaming={isStreaming}
            key={index.toString()}
            text={part.text}
          />
        );
      }
      default: {
        return null;
      }
    }
  });
}

function MarkdownMessage({
  askQuestion,
  contentRef,
  isStreaming,
  text,
}: {
  askQuestion: (question: string) => Promise<void>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  isStreaming: boolean;
  text: string;
}) {
  return (
    <div
      className={cn("chat-bubble-response", "flex max-w-9/10 flex-row gap-2")}
    >
      <div className="not-prose row-span-2 min-w-10 self-end">
        <img
          alt="rental space"
          height="40px"
          src="/favicon-96x96.png"
          width="40px"
          className="rounded-md border-2 border-black shadow-[2px_2px_0px_0px_black]"
        />
      </div>
      <div
        className="rounded-t-md rounded-br-md border-2 border-black bg-[hsl(120,100%,97%)] px-4 py-3 shadow-[4px_4px_0px_0px_black]"
        ref={contentRef}
      >
        <Streamdown
          className="prose prose-base max-w-none"
          components={getComponents({ askQuestion })}
          controls={{ code: false, mermaid: false, table: false }}
          parseIncompleteMarkdown
          remarkPlugins={[remarkGfm]}
          isAnimating={isStreaming}
          mode={isStreaming ? "streaming" : "static"}
        >
          {maskWorkingMemoryTags(text)}
        </Streamdown>
      </div>
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
      const isAsk = href?.startsWith("/?q=");
      return isAsk ? (
        <ActiveLink
          to={`/chat?q=${children}`}
          onClick={(event) => {
            event.preventDefault();
            askQuestion(Children.toArray(children).join(""));
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
      <button
        className="inline-block transform cursor-pointer rounded-base border-2 border-black bg-[hsl(37,92%,65%)] px-4 py-2 font-bold text-black shadow-[3px_3px_0px_0px_black] transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_black]"
        type="button"
      >
        {children}
      </button>
    ),
    h1: ({ children }) => (
      <h1 className={"mt-6 mb-2 font-bold text-black text-xl"}>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className={"mt-6 mb-2 font-bold text-black text-lg"}>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className={"mt-6 mb-2 font-bold text-black text-md"}>{children}</h3>
    ),
    hr: () => <hr className="border-2 border-black" />,
    li: ({ children }) => <li className={"py-1 text-black"}>{children}</li>,
    ol: ({ children }) => (
      <ol className={"ml-4 list-outside list-decimal text-black"}>
        {children}
      </ol>
    ),
    p: ({ children }) => (
      <p className="mt-2 mb-2 whitespace-pre-wrap text-black">{children}</p>
    ),
    strong: ({ children }) => (
      <span className={"font-bold text-black"}>{children}</span>
    ),
    ul: ({ children }) => (
      <ul className={"ml-4 list-outside list-disc"}>{children}</ul>
    ),
  };
}
