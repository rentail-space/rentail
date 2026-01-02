import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import terms from "~/data/terms.md?raw";

export default function TermsOfService() {
  return (
    <article className="container mx-auto my-10 max-w-4xl space-y-8 p-5">
      <title>Terms of Service | Rentail.space</title>
      <meta
        name="description"
        content="Read the Rentail.space Terms of Service: your rights, obligations, and important policies for using our specialty leasing platform."
      />
      <meta
        name="keywords"
        content="terms of service, specialty leasing, retail spaces, rentail.space"
      />
      <link rel="canonical" href="https://rentail.space/terms" />

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
