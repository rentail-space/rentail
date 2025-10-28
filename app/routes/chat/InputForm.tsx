import { IconSend } from "obra-icons-react";
import { useStickToBottomContext } from "use-stick-to-bottom";

export default function InputForm({
  inputRef,
  isSubmitting,
  query,
  sendMessage,
  setQuery,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  isSubmitting: boolean;
  query: string;
  sendMessage: (message: string) => void;
  setQuery: (input: string) => void;
}) {
  const { scrollToBottom } = useStickToBottomContext();

  return (
    <div className="w-full items-center justify-center bg-gray-50 p-2">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(query);
          setQuery("");
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
          ref={inputRef}
          spellCheck="false"
          type="text"
          value={query}
        />
        <div className="-translate-y-1/2 absolute top-1/2 right-2 flex transform gap-2">
          <button
            aria-label="Send message"
            className="flex h-10 w-10 transform cursor-pointer items-center justify-center rounded-xl border-none bg-indigo-500 transition-all duration-200 hover:scale-105 hover:bg-indigo-600 active:scale-95 active:scale-[0.6] active:duration-75 disabled:cursor-not-allowed disabled:bg-gray-300"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <IconSend className="h-6 w-6 animate-spin" />
            ) : (
              <IconSend className="h-6 w-6 text-white" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
