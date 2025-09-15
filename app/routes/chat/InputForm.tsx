import { useStickToBottomContext } from "use-stick-to-bottom";
import PrecannedQuestions from "./PrecannedQuestions";

export default function InputForm({
  input,
  inputRef,
  isResponding,
  isSubmitting,
  onSubmit,
  setInput,
  stopLLM,
}: {
  input: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isResponding: boolean;
  isSubmitting: boolean;
  onSubmit: (input: string) => void;
  setInput: (input: string) => void;
  stopLLM: (scrollToBottom: () => void) => Promise<void>;
}) {
  const { scrollToBottom } = useStickToBottomContext();

  return (
    <div className="w-full items-center justify-center bg-gray-50 p-2">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (inputRef.current) {
            const question = inputRef.current.value.trim();
            if (question) onSubmit(question);
            inputRef.current.value = "";
            scrollToBottom();
          }
        }}
        className="relative w-full"
      >
        <input
          ref={inputRef}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          // biome-ignore lint/a11y/noAutofocus: we want to autofocus the input
          autoFocus={true}
          className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 pr-24 pl-5 text-base placeholder-gray-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          disabled={isSubmitting}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about retail spaces..."
          spellCheck="false"
          type="text"
          value={input}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 transform flex gap-2">
          {isResponding && (
            <button
              aria-label="Stop generation"
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105"
              onClick={() => stopLLM(scrollToBottom)}
              type="button"
            >
              <StopIcon />
            </button>
          )}
          <button
            className="flex h-10 w-10 transform cursor-pointer items-center justify-center rounded-xl border-none bg-indigo-500 transition-all duration-200 hover:scale-105 hover:bg-indigo-600 active:scale-95 active:scale-[0.6] active:duration-75 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={isSubmitting}
            type="submit"
          >
            <SendIcon isSubmitting={isSubmitting} />
          </button>
        </div>
      </form>
      <PrecannedQuestions inputRef={inputRef} />
    </div>
  );
}

function SendIcon({ isSubmitting }: { isSubmitting: boolean }) {
  return isSubmitting ? (
    <svg
      className="h-5 w-5 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <title>Sending...</title>
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  ) : (
    <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
      <title>Send arrow</title>
      <path
        d="M12 2L12 22M5 9L12 2L19 9"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        stroke="white"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
      className="h-10 w-10"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        fill="#e9edf2"
        d="M64 45.3L45.3 64H18.7L0 45.3V18.7L18.7 0h26.6L64 18.7z"
      />
      <path
        fill="#ed4c5c"
        d="M58 42.8L42.8 58H21.2L6 42.8V21.2L21.2 6h21.6L58 21.2z"
      />
    </svg>
  );
}
