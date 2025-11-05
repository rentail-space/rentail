import { ChevronsDown } from "lucide-react";
import { useStickToBottomContext } from "use-stick-to-bottom";

export default function ScrollButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  return (
    <button
      className="fixed right-6 bottom-24 z-10 flex h-12 w-12 animate-bounce items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
      onClick={() => scrollToBottom()}
      type="button"
      aria-label="Scroll to bottom"
      title="Scroll to bottom"
    >
      <ChevronsDown className="h-6 w-6 text-gray-600" />
    </button>
  );
}
