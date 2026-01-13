import { Send, Square } from "lucide-react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { Button } from "~/components/ui/Button";
import { trackEvent } from "~/lib/analytics";
import { cn } from "~/lib/utils";

export default function InputForm({
  isResponding,
  isSubmitting,
  query,
  sendMessage,
  setQuery,
  stopChat,
}: {
  isResponding: boolean;
  isSubmitting: boolean;
  query: string;
  sendMessage: (message: string) => void;
  setQuery: (input: string | null) => void;
  stopChat: () => void;
}) {
  const { scrollToBottom } = useStickToBottomContext();

  return (
    <div className="w-full items-center justify-center bg-[hsl(60,100%,99%)] p-4 pt-0">
      <form
        className="relative w-full"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(query.trim());
          setQuery(null);
          scrollToBottom();
          trackEvent("send_message", { category: "chat" });
        }}
      >
        <input
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          // biome-ignore lint/a11y/noAutofocus: we want to autofocus the input
          autoFocus={true}
          className={cn(
            "w-full py-4 pr-24 pl-5",
            "rounded-base border-2 border-black bg-white shadow-[4px_4px_0px_0px_hsl(37,92%,65%)] outline-none",
            "font-medium text-base text-black placeholder-gray-600",
            "transition-all duration-100 focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[6px_6px_0px_0px_hsl(37,92%,65%)]",
            "placeholder:text-gray-400",
          )}
          disabled={isSubmitting}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Show me mall spaces for [product type] under $X/month"
          spellCheck="false"
          type="text"
          value={query}
        />

        <div className="absolute top-1/2 right-3 flex -translate-y-1/2 transform gap-2">
          {false && (
            <StopButton isResponding={isResponding} stopChat={stopChat} />
          )}
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
        className={cn("h-5 w-5 text-black", isSubmitting && "animate-spin")}
      />
    </Button>
  );
}

function StopButton({
  isResponding,
  stopChat,
}: {
  isResponding: boolean;
  stopChat: () => void;
}) {
  if (!isResponding) return null;

  return (
    <Button
      aria-label="Stop"
      className="h-12 w-12"
      onClick={stopChat}
      type="button"
    >
      <Square className="h-5 w-5 text-black" />
    </Button>
  );
}
