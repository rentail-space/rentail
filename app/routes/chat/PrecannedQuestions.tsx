import { useStickToBottomContext } from "use-stick-to-bottom";
import askQuestion from "./askQuestion";
import precanned from "./precanned.md?raw";

export default function PrecannedQuestions({
  inputRef,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { scrollToBottom } = useStickToBottomContext();
  return (
    <div className="mx-auto w-full overflow-x-auto overflow-y-hidden p-2">
      <div className="flex flex-row gap-2 font-bold text-white text-xs">
        {precanned
          .split(/\n+/)
          .filter((question) => question.trim().length > 0)
          .map((question) => (
            <button
              className="btn btn-soft btn-sm"
              key={question}
              onClick={() => {
                askQuestion({
                  inputRef,
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
