import { useStickToBottomContext } from "use-stick-to-bottom";
import PrecannedQuestions from "./PrecannedQuestions";

export default function InputForm({
  input,
  setInput,
  isTyping,
  onSubmit,
  inputRef,
}: {
  input: string;
  setInput: (input: string) => void;
  isTyping: boolean;
  onSubmit: (input: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { scrollToBottom } = useStickToBottomContext();
  return (
    <div className="w-full items-center justify-center bg-gray-50 p-2">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const question = inputRef.current?.value.trim();
          if (question) {
            onSubmit(question);
            scrollToBottom();
          }
          if (inputRef.current) inputRef.current.value = "";
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
          className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 pr-16 pl-5 text-base placeholder-gray-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          disabled={isTyping}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about retail spaces..."
          spellCheck="false"
          type="text"
          value={input}
        />
        <button
          className="-translate-y-1/2 absolute top-1/2 right-2 flex h-10 w-10 transform cursor-pointer items-center justify-center rounded-xl border-none bg-indigo-500 transition-all duration-200 hover:scale-105 hover:bg-indigo-600 active:scale-95 active:scale-[0.6] active:duration-75"
          type="submit"
        >
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
        </button>
      </form>
      <PrecannedQuestions inputRef={inputRef} />
    </div>
  );
}
