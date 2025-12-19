import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import terms from "~/data/terms.md?raw";

export default function TermsOfService() {
  return (
    <article className="container mx-auto my-10 max-w-4xl space-y-8 p-5">
      <title>
        Terms of Service - Specialty Leasing & Retail Spaces | Rentail.space
      </title>
      <meta
        name="description"
        content="Our terms of service explain how we use and protect your personal information when you use our website."
      />
      <meta
        name="keywords"
        content="terms of service, specialty leasing, retail spaces, rentail.space"
      />

      <Streamdown
        className="prose prose-lg mx-auto"
        mode="static"
        remarkPlugins={[remarkGfm]}
      >
        {terms}
      </Streamdown>
    </article>
  );
}
