export default function InputForm({
  input,
  setInput,
  isSubmitting: isTyping,
  onSubmit,
}: {
  input: string;
  setInput: (input: string) => void;
  isSubmitting: boolean;
  onSubmit: (input: string) => void;
}) {
  return (
    <div className="bg-gray-50 p-2 flex justify-center items-center w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (input.trim()) onSubmit(input.trim());
        }}
        className="relative w-full"
      >
        <input
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          // biome-ignore lint/a11y/noAutofocus: we want to autofocus the input
          autoFocus={true}
          className="w-full py-4 pl-5 pr-16 border-2 border-gray-200 rounded-2xl text-base outline-none transition-all duration-200 bg-white placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          disabled={isTyping}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about retail spaces..."
          spellCheck="false"
          type="text"
          value={input}
        />
        <button
          className="absolute right-2 top-1/2 transform -translate-y-1/2 border-none rounded-xl w-10 h-10 flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 transition-all duration-200 active:scale-[0.6] active:duration-75 cursor-pointer active:scale-95 hover:scale-105"
          type="submit"
        >
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
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
    </div>
  );
}
