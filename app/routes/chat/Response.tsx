import React, { type HTMLAttributes } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useStickToBottomContext } from "use-stick-to-bottom";
import askQuestion from "./askQuestion";

/**
 * Parses markdown text and removes incomplete tokens to prevent partial rendering
 * of links, images, bold, and italic formatting during streaming.
 */
function parseIncompleteMarkdown(text: string): string {
  if (!text || typeof text !== "string") return text;

  let result = text;

  // Handle incomplete links and images
  // Pattern: [...] or ![...] where the closing ] is missing
  const linkImagePattern = /(!?\[)([^\]]*?)$/;
  const linkMatch = result.match(linkImagePattern);
  if (linkMatch) {
    // If we have an unterminated [ or ![, remove it and everything after
    const startIndex = result.lastIndexOf(linkMatch[1]);
    result = result.substring(0, startIndex);
  }

  // Handle incomplete bold formatting (**)
  const boldPattern = /(\*\*)([^*]*?)$/;
  const boldMatch = result.match(boldPattern);
  if (boldMatch) {
    // Count the number of ** in the entire string
    const asteriskPairs = (result.match(/\*\*/g) || []).length;
    // If odd number of **, we have an incomplete bold - complete it
    if (asteriskPairs % 2 === 1) result = `${result}**`;
  }

  // Handle incomplete italic formatting (__)
  const italicPattern = /(__)([^_]*?)$/;
  const italicMatch = result.match(italicPattern);
  if (italicMatch) {
    // Count the number of __ in the entire string
    const underscorePairs = (result.match(/__/g) || []).length;
    // If odd number of __, we have an incomplete italic - complete it
    if (underscorePairs % 2 === 1) result = `${result}__`;
  }

  // Handle incomplete single asterisk italic (*)
  const singleAsteriskPattern = /(\*)([^*]*?)$/;
  const singleAsteriskMatch = result.match(singleAsteriskPattern);
  if (singleAsteriskMatch) {
    // Count single asterisks that aren't part of **
    const singleAsterisks = result.split("").reduce((acc, char, index) => {
      if (char === "*") {
        // Check if it's part of a ** pair
        const prevChar = result[index - 1];
        const nextChar = result[index + 1];
        if (prevChar !== "*" && nextChar !== "*") return acc + 1;
      }
      return acc;
    }, 0);

    // If odd number of single *, we have an incomplete italic - complete it
    if (singleAsterisks % 2 === 1) result = `${result}*`;
  }

  // Handle incomplete single underscore italic (_)
  const singleUnderscorePattern = /(_)([^_]*?)$/;
  const singleUnderscoreMatch = result.match(singleUnderscorePattern);
  if (singleUnderscoreMatch) {
    // Count single underscores that aren't part of __
    const singleUnderscores = result.split("").reduce((acc, char, index) => {
      if (char === "_") {
        // Check if it's part of a __ pair
        const prevChar = result[index - 1];
        const nextChar = result[index + 1];
        if (prevChar !== "_" && nextChar !== "_") return acc + 1;
      }
      return acc;
    }, 0);

    // If odd number of single _, we have an incomplete italic - complete it
    if (singleUnderscores % 2 === 1) result = `${result}_`;
  }

  // Handle incomplete strikethrough formatting (~~)
  const strikethroughPattern = /(~~)([^~]*?)$/;
  const strikethroughMatch = result.match(strikethroughPattern);
  if (strikethroughMatch) {
    // Count the number of ~~ in the entire string
    const tildePairs = (result.match(/~~/g) || []).length;
    // If odd number of ~~, we have an incomplete strikethrough - complete it
    if (tildePairs % 2 === 1) result = `${result}~~`;
  }

  return result;
}

function getComponents(
  setInput: (input: string) => void,
): Options["components"] {
  return {
    ol: ({ node, children, className, ...props }) => (
      <ol className={"ml-4 list-outside list-decimal"} {...props}>
        {children}
      </ol>
    ),
    li: ({ node, children, className, ...props }) => (
      <li className={"py-1"} {...props}>
        {children}
      </li>
    ),
    ul: ({ node, children, className, ...props }) => (
      <ul className={"ml-4 list-outside list-disc"} {...props}>
        {children}
      </ul>
    ),
    strong: ({ node, children, className, ...props }) => (
      <span className={"font-semibold"} {...props}>
        {children}
      </span>
    ),
    a: ({ node, children, className, ...props }) => {
      const { scrollToBottom } = useStickToBottomContext();
      return (
        <a
          className="btn btn-soft btn-primary"
          href={`?q=${children}`}
          onClick={async (event) => {
            event.preventDefault();
            await askQuestion({
              setInput,
              question: React.Children.toArray(children),
              scrollToBottom,
            });
          }}
          rel="noreferrer"
          target="_blank"
          {...props}
        >
          {children}
        </a>
      );
    },
    h1: ({ node, children, className, ...props }) => (
      <h1 className={"mt-6 mb-2 font-semibold text-xl"} {...props}>
        {children}
      </h1>
    ),
    h2: ({ node, children, className, ...props }) => (
      <h2 className={"mt-6 mb-2 font-semibold text-lg"} {...props}>
        {children}
      </h2>
    ),
    h3: ({ node, children, className, ...props }) => (
      <h3 className={"mt-6 mb-2 font-semibold text-md"} {...props}>
        {children}
      </h3>
    ),
    hr: () => <hr className="border-gray-300" />,
    p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="whitespace-pre-wrap mt-2 mb-2">{children}</p>
    ),
  };
}

export default function Response({
  className,
  setInput,
  options,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  setInput: (input: string) => void;
  options?: Options;
  children: Options["children"];
}) {
  const parsedChildren =
    typeof children === "string" ? parseIncompleteMarkdown(children) : children;

  return (
    <div
      className={"size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"}
      {...props}
    >
      <ReactMarkdown
        components={getComponents(setInput)}
        remarkPlugins={[remarkGfm]}
        {...options}
      >
        {parsedChildren}
      </ReactMarkdown>
    </div>
  );
}
