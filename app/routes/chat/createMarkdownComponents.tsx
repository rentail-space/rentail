import type { ChangeEvent, RefObject } from "react";

export default function createMarkdownComponents({
  handleInputChange,
  inputId,
  messagesRef,
  askQuestion,
}: {
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
  return {
    a: ({ children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        className="btn btn-soft btn-primary"
        href={`?q=${children}`}
        onClick={async (event) => {
          event.preventDefault();
          await askQuestion({
            handleInputChange,
            inputId,
            question: `${children}`,
            messagesRef,
          });
        }}
      >
        {children}
      </a>
    ),
    h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className="text-xl font-bold">{children}</h1>
    ),
    h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className="text-lg font-semibold">{children}</h2>
    ),
    h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="text-md font-semibold">{children}</h3>
    ),
    hr: () => <hr className="border-gray-300" />,
    ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="ml-8 list-decimal">{children}</ol>
    ),
    p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="whitespace-pre-wrap mt-2 mb-2">{children}</p>
    ),
    ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="ml-6 list-disc">{children}</ul>
    ),
  };
}
