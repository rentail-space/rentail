import { delay } from "es-toolkit";
import { useTimeout } from "usehooks-ts";

export default function askQuestion({
  inputRef,
  scrollToBottom,
  setQuery,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  scrollToBottom: () => void;
  setQuery: (query: string) => void;
}) {
  return async function ask(question: string): Promise<void> {
    // Clear input and make it readonly during typing animation
    setQuery("");

    // Auto-scroll to bottom before starting animation
    scrollToBottom();

    // Animate typing the question
    let input = "";
    for (let i = 0; i < question.length; i++) {
      await delay(10);
      input += question[i];
      setQuery(input);
    }

    // Re-enable input and trigger change event
    setQuery(input);

    // Final scroll to bottom and focus
    useTimeout(() => {
      inputRef.current?.focus();
      scrollToBottom();
    }, 10);
  };
}
