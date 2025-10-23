import type { TextPart } from "ai";
import { IconCircleCloseFill, IconSend } from "obra-icons-react";
import { useStickToBottomContext } from "use-stick-to-bottom";

export default function InputForm({
  inputRef,
  isResponding,
  isSubmitting,
  query,
  sendMessage,
  setQuery,
  stopLLM,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  isResponding: boolean;
  isSubmitting: boolean;
  query: string;
  sendMessage: (message: { parts: TextPart[]; role: "user" }) => void;
  setQuery: (input: string) => void;
  stopLLM: (scrollToBottom: () => void) => Promise<void>;
}) {
  const { scrollToBottom } = useStickToBottomContext();

  return (
    <div className="w-full items-center justify-center bg-gray-50 p-2">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage({ parts: [{ text: query, type: "text" }], role: "user" });
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
        <div className="absolute right-2 top-1/2 -translate-y-1/2 transform flex gap-2">
          {isResponding && (
            <button
              aria-label="Stop generation"
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105"
              onClick={() => stopLLM(scrollToBottom)}
              type="button"
            >
              <IconCircleCloseFill className="text-red-500 hover:text-red-600 w-10 h-10" />
            </button>
          )}
          <button
            aria-label="Send message"
            className="flex h-10 w-10 transform cursor-pointer items-center justify-center rounded-xl border-none bg-indigo-500 transition-all duration-200 hover:scale-105 hover:bg-indigo-600 active:scale-95 active:scale-[0.6] active:duration-75 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <IconSend className="animate-spin w-6 h-6" />
            ) : (
              <IconSend className="text-white w-6 h-6" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
