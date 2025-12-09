import { ChevronsDown } from "lucide-react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { cn } from "~/lib/utils";

export default function ScrollButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  return isAtBottom ? null : (
    <button
      className={cn(
        "fixed right-6 bottom-24 z-10 h-12 w-12",
        "flex items-center justify-center rounded-sm",
        "border-2 border-black bg-[hsl(37,92%,65%)] shadow-[4px_4px_0px_0px_black] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_black]",
        "animate-bounce transition-all duration-700",
      )}
      onClick={() => scrollToBottom()}
      type="button"
      aria-label="Scroll to bottom"
      title="Scroll to bottom"
    >
      <ChevronsDown className="h-6 w-6 text-black" />
    </button>
  );
}
