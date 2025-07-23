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
        onClick={async () =>
          await askQuestion({
            handleInputChange,
            inputId,
            question: `${children}`,
            messagesRef,
          })
        }
        href={`?q=${children}`}
      >
        {children}
      </a>
    ),
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className="text-xl font-bold" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className="text-lg font-semibold" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="text-md font-semibold" {...props}>
        {children}
      </h3>
    ),
    hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
      <hr className="border-gray-300" {...props} />
    ),
    ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="ml-8 list-decimal" {...props}>
        {children}
      </ol>
    ),
    p: ({ ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="whitespace-pre-wrap my-1" {...props} />
    ),
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="ml-6 list-disc" {...props}>
        {children}
      </ul>
    ),
  };
}
