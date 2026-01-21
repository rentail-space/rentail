import { Link } from "react-router";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import privacy from "~/data/privacy.md?raw";

export default function PrivacyPolicy() {
  return (
    <article className="container mx-auto my-10 max-w-4xl space-y-8 p-5">
      <title>Privacy Policy | Rentail.space</title>
      <meta
        name="description"
        content="Learn how Rentail.space collects, uses, and safeguards your personal information to ensure your privacy when using our specialty leasing platform."
      />
      <meta
        name="keywords"
        content="privacy policy, specialty leasing, retail spaces, rentail.space"
      />
      <link rel="canonical" href="https://rentail.space/privacy" />

      <Streamdown
        className="prose prose-lg mx-auto"
        mode="static"
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) =>
            href ? <Link to={href}>{children}</Link> : children,
        }}
      >
        {privacy}
      </Streamdown>
    </article>
  );
}
