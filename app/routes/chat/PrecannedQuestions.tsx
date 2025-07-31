import type { RefObject } from "react";
import { useMemo } from "react";
import precanned from "./precanned.md?raw";

export default function PrecannedQuestions({
  askQuestion,
  inputId,
  messagesRef,
  setInput,
}: {
  askQuestion: (params: {
    inputId: string;
    messagesRef: RefObject<HTMLDivElement | null>;
    question: string;
    setInput: (input: string) => void;
  }) => Promise<void>;
  inputId: string;
  messagesRef: RefObject<HTMLDivElement | null>;
  setInput: (input: string) => void;
}) {
  const questions = useMemo(
    () => precanned.split(/\n+/).filter((question) => question.trim()),
    [],
  );
  const handleQuestionClick = (question: string) => {
    askQuestion({ setInput, inputId, question, messagesRef });
  };

  return (
    <div className="mx-auto overflow-x-auto overflow-y-hidden w-full p-2">
      <div className="text-white text-xs font-bold flex flex-row gap-2">
        {questions.map((question) => (
          <button
            className="btn btn-soft btn-sm"
            key={question}
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
