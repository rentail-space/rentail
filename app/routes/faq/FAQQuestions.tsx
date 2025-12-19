import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import faq from "./faq";

export default function FAQQuestions() {
  return (
    <section
      className="mx-auto max-w-4xl bg-[hsl(60,100%,99%)] py-20"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <div className="flex flex-col gap-12">
        {faq.map((category) => (
          <div key={category.category}>
            <h2 className="mb-6 font-bold text-3xl text-black leading-tight">
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
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <details
      className="rounded-md border-2 border-black bg-white shadow-[4px_4px_0px_0px_black]"
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      open
      itemScope
      itemType="https://schema.org/Question"
      itemProp="mainEntity"
    >
      <summary className="flex w-full cursor-pointer items-center justify-between gap-4 p-6 text-left">
        <h3 className="font-bold text-black text-lg" itemProp="name">
          {question}
        </h3>
        <ChevronDown
          className={twMerge(
            "h-5 w-5 shrink-0 text-[hsl(37,92%,65%)] transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </summary>
      <div
        className="border-black border-t-2 px-6 pt-4 pb-6"
        itemScope
        itemType="https://schema.org/Answer"
        itemProp="acceptedAnswer"
      >
        <p className="font-medium text-black leading-relaxed" itemProp="text">
          {answer}
        </p>
      </div>
    </details>
  );
}
