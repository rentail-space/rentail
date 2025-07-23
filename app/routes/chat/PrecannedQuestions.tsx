import type { ChangeEvent, RefObject } from "react";
import { useCallback, useMemo } from "react";
import precanned from "./precanned.md?raw";

export default function PrecannedQuestions({
  handleInputChange,
  inputId,
  messagesRef,
  askQuestion,
}: {
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  messagesRef: RefObject<HTMLDivElement | null>;
  askQuestion: (params: {
    handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
    inputId: string;
    question: string;
    messagesRef: RefObject<HTMLDivElement | null>;
  }) => Promise<void>;
}) {
  const questions = useMemo(
    () => precanned.split(/\n+/).filter((question) => question.trim()),
    [],
  );
  const handleQuestionClick = useCallback(
    (question: string) => {
      askQuestion({ handleInputChange, inputId, question, messagesRef });
    },
    [handleInputChange, inputId, messagesRef, askQuestion],
  );

  return (
    <div className="mx-auto overflow-x-auto overflow-y-hidden w-full p-2">
      <div className="text-white text-xs font-bold flex flex-row gap-2">
        {questions.map((question) => (
          <button
            key={question}
            className="bg-gray-200 rounded-3xl p-2 font-medium text-gray-800 hover:bg-gray-300 hover:underline"
            onClick={() => handleQuestionClick(question)}
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
