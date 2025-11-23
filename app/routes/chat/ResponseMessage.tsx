import type { UIMessage } from "ai";
import type React from "react";
import { Children, type JSX, useEffect, useRef } from "react";
import { Link } from "react-router";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import type { ScrollToBottom } from "use-stick-to-bottom";
import { maskWorkingMemoryTags } from "~/lib/userProfile";

export default function ResponseMessage({
  askQuestion,
  message,
  scrollToBottom,
}: {
  askQuestion: (question: string) => Promise<void>;
  isLast: boolean;
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
  text,
}: {
  askQuestion: (question: string) => Promise<void>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  text: string;
}) {
  return (
    <div className="chat chat-start">
      <div className="chat-image avatar not-prose w-8">
        <img
          alt="rental space"
          height="32px"
          src="/favicon-96x96.png"
          width="32px"
        />
      </div>
      <div className="chat-bubble chat-bubble-response prose prose-base">
        <div ref={contentRef}>
          <Streamdown
            components={getComponents({ askQuestion })}
            remarkPlugins={[remarkGfm]}
            parseIncompleteMarkdown={true}
            mode="static"
            controls={{
              code: false,
              mermaid: false,
              table: false,
            }}
          >
            {maskWorkingMemoryTags(text)}
          </Streamdown>
        </div>
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
        <Link
          className="btn btn-soft btn-primary"
          to={`/chat?q=${children}`}
          onClick={(event) => {
            event.preventDefault();
            askQuestion(Children.toArray(children).join(""));
          }}
        >
          {children}
        </Link>
      ) : (
        <Link
          className="text-blue-500 no-underline hover:text-blue-700 hover:underline"
          to={href ?? ""}
          target="_blank"
        >
          {children}
        </Link>
      );
    },
    button: ({ children }) => (
      <button className="btn btn-soft btn-primary" type="button">
        {children}
      </button>
    ),
    h1: ({ children }) => (
      <h1 className={"mt-6 mb-2 font-semibold text-xl"}>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className={"mt-6 mb-2 font-semibold text-lg"}>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className={"mt-6 mb-2 font-semibold text-md"}>{children}</h3>
    ),
    hr: () => <hr className="border-gray-300" />,
    li: ({ children }) => <li className={"py-1"}>{children}</li>,
    ol: ({ children }) => (
      <ol className={"ml-4 list-outside list-decimal"}>{children}</ol>
    ),
    p: ({ children }) => (
      <p className="mt-2 mb-2 whitespace-pre-wrap">{children}</p>
    ),
    strong: ({ children }) => (
      <span className={"font-semibold"}>{children}</span>
    ),
    ul: ({ children }) => (
      <ul className={"ml-4 list-outside list-disc"}>{children}</ul>
    ),
  };
}
