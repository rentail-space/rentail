import { ChevronsDown } from "lucide-react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/utils";

export default function ScrollButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  return isAtBottom ? null : (
    <Button
      className={cn(
        "fixed right-6 bottom-24 z-10 h-12 w-12",
        "animate-bounce transition-all duration-1500",
      )}
      onClick={() => scrollToBottom()}
      aria-label="Scroll to bottom"
      variant="default"
    >
      <ChevronsDown className="h-6 w-6 text-black" />
    </Button>
  );
}
