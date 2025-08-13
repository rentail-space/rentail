import invariant from "tiny-invariant";
import { useStickToBottomContext } from "use-stick-to-bottom";
import askQuestion from "./askQuestion";
import precanned from "./precanned.md?raw";

export default function PrecannedQuestions({
  setInput,
}: {
  setInput: React.Dispatch<React.SetStateAction<string>>;
}) {
  invariant(typeof setInput === "function", "setInput is required");
  const { scrollToBottom } = useStickToBottomContext();
  return (
    <div className="mx-auto overflow-x-auto overflow-y-hidden w-full p-2">
      <div className="text-white text-xs font-bold flex flex-row gap-2">
        {precanned
          .split(/\n+/)
          .filter((question) => question.trim())
          .map((question) => (
            <button
              className="btn btn-soft btn-sm"
              key={question}
              onClick={() => {
                askQuestion({
                  setInput,
                  question: question
                    .split(/\n+/)
                    .filter((question) => question.trim()),
                  scrollToBottom,
                });
              }}
              title="Click to ask this question"
              type="button"
            >
              Q: {question}
            </button>
          ))}
      </div>
    </div>
  );
}
