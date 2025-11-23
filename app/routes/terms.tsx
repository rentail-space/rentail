import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import terms from "~/data/terms.md?raw";

export default function TermsOfService() {
  return (
    <div className="min-h-screen max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Streamdown
        className="prose prose-lg mx-auto"
        mode="static"
        remarkPlugins={[remarkGfm]}
      >
        {terms}
      </Streamdown>
    </div>
  );
}
