import { Send, Square } from "lucide-react";
import { useStickToBottomContext } from "use-stick-to-bottom";
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
    <div className="w-full items-center justify-center bg-[hsl(60,100%,99%)] p-4">
      <form
        className="relative w-full"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(query.trim());
          setQuery(null);
          scrollToBottom();
        }}
      >
        <input
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          // biome-ignore lint/a11y/noAutofocus: we want to autofocus the input
          autoFocus={true}
          className="w-full rounded-[5px] border-2 border-black bg-white py-4 pr-24 pl-5 font-medium text-base text-black placeholder-gray-600 shadow-[4px_4px_0px_0px_hsl(37,92%,65%)] outline-none transition-all duration-100 focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[6px_6px_0px_0px_hsl(37,92%,65%)]"
          disabled={isSubmitting}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask me any question about retail spaces..."
          spellCheck="false"
          type="text"
          value={query}
        />

        <div className="-translate-y-1/2 absolute top-1/2 right-3 flex transform gap-2">
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
    <button
      aria-label="Send message"
      className={cn(
        "mb-1 flex h-12 w-12 items-center justify-center",
        "rounded-md border-2 border-black bg-[hsl(37,92%,65%)] font-bold shadow-[3px_3px_0px_0px_black]",
        "transform cursor-pointer transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_black] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none",
      )}
      disabled={isSubmitting}
      type="submit"
    >
      {isSubmitting ? (
        <Send className="h-5 w-5 animate-spin text-black" />
      ) : (
        <Send className="h-5 w-5 text-black" />
      )}
    </button>
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
    <button
      onClick={stopChat}
      aria-label="Stop"
      className="flex h-12 w-12 transform cursor-pointer items-center justify-center rounded-[5px] border-2 border-black bg-red-500 font-bold shadow-[3px_3px_0px_0px_black] transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_black]"
      type="button"
    >
      <Square className="h-5 w-5 text-black" />
    </button>
  );
}
