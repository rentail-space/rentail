import { Send, Square } from "lucide-react";
import { useStickToBottomContext } from "use-stick-to-bottom";

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
    <div className="w-full items-center justify-center bg-gray-50 p-2">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(query);
          setQuery(null);
          scrollToBottom();
        }}
        className="relative w-full"
      >
        <input
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          // biome-ignore lint/a11y/noAutofocus: we want to autofocus the input
          autoFocus={true}
          className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 pr-24 pl-5 text-base placeholder-gray-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          disabled={isSubmitting}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask me any question about retail spaces..."
          spellCheck="false"
          type="text"
          value={query}
        />
        <div className="-translate-y-1/2 absolute top-1/2 right-2 flex transform gap-2">
          {false && (
            <StopButton isResponding={isResponding} stopChat={stopChat} />
          )}
          <button
            aria-label="Send message"
            className="flex h-10 w-10 transform cursor-pointer items-center justify-center rounded-xl border-none bg-indigo-500 transition-all duration-200 hover:scale-105 hover:bg-indigo-600 active:scale-95 active:scale-[0.6] active:duration-75 disabled:cursor-not-allowed disabled:bg-gray-300"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <Send className="h-6 w-6 animate-spin" />
            ) : (
              <Send className="h-6 w-6 text-white" />
            )}
          </button>
        </div>
      </form>
    </div>
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
      className="flex h-10 w-10 transform cursor-pointer items-center justify-center rounded-xl border-none bg-red-500 transition-all duration-200 hover:scale-105 hover:bg-red-600 active:scale-95 active:scale-[0.6] active:duration-75"
      type="button"
    >
      <Square className="h-6 w-6 text-white" />
    </button>
  );
}
