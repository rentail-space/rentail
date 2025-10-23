import { IconChevronDoubleDown } from "obra-icons-react";
import { useStickToBottomContext } from "use-stick-to-bottom";

export default function ScrollButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  return (
    <button
      className="fixed right-6 bottom-24 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
      onClick={() => scrollToBottom()}
      type="button"
      aria-label="Scroll to bottom"
      title="Scroll to bottom"
    >
      <IconChevronDoubleDown className="text-gray-600 w-6 h-6" />
    </button>
  );
}
