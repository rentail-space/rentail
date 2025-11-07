import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function FAQQuestions({
  faqs,
}: {
  faqs: {
    category: string;
    questions: { question: string; answer: string }[];
  }[];
}) {
  return (
    <section className="px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col gap-12">
          {faqs.map((category) => (
            <div key={category.category}>
              <h2 className="mb-6 font-bold text-3xl text-gray-900">
                {category.category}
              </h2>
              <div className="flex flex-col gap-4">
                {category.questions.map((faq) => (
                  <FAQItem
                    key={faq.question}
                    question={faq.question}
                    answer={faq.answer}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 p-6 text-left"
      >
        <h3 className="font-semibold text-gray-900 text-lg">{question}</h3>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-blue-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="border-gray-200 border-t px-6 pt-4 pb-6">
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
