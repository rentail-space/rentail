import { delay } from "es-toolkit";
import type { ReactNode } from "react";

export default async function askQuestion({
  question,
  scrollToBottom,
  inputRef,
}: {
  question: Exclude<ReactNode, boolean | null | undefined>[];
  scrollToBottom: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  if (!inputRef.current) return;

  // Clear input and make it readonly during typing animation
  inputRef.current.value = "";

  // Auto-scroll to bottom before starting animation
  scrollToBottom();

  // Animate typing the question
  let input = "";
  const text = question.join("");
  for (let i = 0; i < text.length; i++) {
    await delay(10);
    input += text[i];
    inputRef.current.value = input;
  }

  // Re-enable input and trigger change event
  inputRef.current.value = input;

  // Final scroll to bottom and focus
  setTimeout(() => {
    inputRef.current?.focus();
    scrollToBottom();
  }, 10);
}
