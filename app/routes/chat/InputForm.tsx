import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { Button } from "~/components/ui/Button";
import { trackEvent } from "~/lib/useAnalytics";

export default function InputForm({
  isSubmitting,
  query: initialQuery,
  sendMessage,
  setQuery,
}: {
  isSubmitting: boolean;
  query: string;
  sendMessage: (message: string) => void;
  setQuery: (input: string | null) => void;
}) {
  const { scrollToBottom } = useStickToBottomContext();
  // Use local state for typing to avoid URL updates on every keystroke
  const [inputValue, setInputValue] = useState(initialQuery);

  // Sync external query changes (e.g., from URL) to local state
  useEffect(() => {
    setInputValue(initialQuery);
  }, [initialQuery]);

  return (
    <div className="w-full items-center justify-center bg-[hsl(60,100%,99%)] p-4 pt-0">
      <form
        className="relative w-full"
        onSubmit={(event) => {
          event.preventDefault();
          const message = inputValue.trim();
          if (message === "") return;
          sendMessage(message);
          setInputValue("");
          setQuery(null);
          void scrollToBottom();
          trackEvent("send_message", { category: "chat" });
        }}
      >
        <input
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          autoFocus={true}
          className={twMerge(
            "w-full py-4 pr-24 pl-5",
            "rounded-base border-2 border-black bg-white shadow-[4px_4px_0px_0px_hsl(37,92%,65%)] outline-none",
            "font-medium text-base text-black placeholder:text-gray-400",
            "transition-all duration-100 focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[6px_6px_0px_0px_hsl(37,92%,65%)] focus:ring-4 focus:ring-black/10",
          )}
          disabled={isSubmitting}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Show me mall spaces for [product type] under $X/month"
          spellCheck="false"
          type="text"
          value={inputValue}
        />

        <div className="absolute top-1/2 right-3 flex -translate-y-1/2 transform gap-2">
          <SubmitButton isSubmitting={isSubmitting} />
        </div>
      </form>
    </div>
  );
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button
      aria-label="Send message"
      className={"mb-1 h-12 w-12"}
      disabled={isSubmitting}
      type="submit"
      variant="default"
    >
      <Send
        className={twMerge(
          "h-5 w-5 text-black",
          isSubmitting && "animate-spin",
        )}
      />
    </Button>
  );
}
