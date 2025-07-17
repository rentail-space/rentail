import type { ChangeEvent, RefObject } from "react";

interface AskQuestionParams {
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  question: string;
  messagesRef: RefObject<HTMLDivElement | null>;
}

interface MarkdownComponentsProps {
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  messagesRef: RefObject<HTMLDivElement | null>;
  askQuestion: (params: AskQuestionParams) => Promise<void>;
}

export function createMarkdownComponents({
  handleInputChange,
  inputId,
  messagesRef,
  askQuestion,
}: MarkdownComponentsProps) {
  return {
    a: ({ children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <button
        className="bg-gray-200 rounded-3xl p-4 m-1 font-medium text-gray-800 hover:bg-gray-300 hover:underline"
        onClick={async () =>
          await askQuestion({
            handleInputChange,
            inputId,
            question: `${children}`,
            messagesRef,
          })
        }
        type="button"
      >
        {children}
      </button>
    ),
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className="text-xl font-bold my-2" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className="text-lg font-semibold my-2" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="text-md font-semibold my-2" {...props}>
        {children}
      </h3>
    ),
    hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
      <hr className="border-gray-300 my-2" {...props} />
    ),
    ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="ml-8 list-decimal" {...props}>
        {children}
      </ol>
    ),
    p: ({ ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="whitespace-pre-wrap my-2" {...props} />
    ),
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="ml-6 list-disc" {...props}>
        {children}
      </ul>
    ),
  };
}

export type MarkdownComponents = ReturnType<typeof createMarkdownComponents>;
