import type { ReactNode } from "react";

export default async function askQuestion({
  setInput,
  question,
  scrollToBottom,
}: {
  setInput: (input: string) => void;
  question: Array<Exclude<ReactNode, boolean | null | undefined>>;
  scrollToBottom: () => void;
}) {
  let input = "";
  // Clear input and make it readonly during typing animation
  setInput(input);

  // Auto-scroll to bottom
  scrollToBottom();

  const text = question.join("");

  // Animate typing the question
  for (let i = 0; i < text.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    input += text[i];
    setInput(input);
  }

  // Re-enable input and trigger change event
  setInput(input);
}
