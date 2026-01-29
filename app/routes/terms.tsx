import { Link } from "react-router";
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
      <meta property="og:title" content="Terms of Service | Rentail.space" />
      <meta
        property="og:description"
        content="Read the Rentail.space Terms of Service: your rights, obligations, and important policies for using our specialty leasing platform."
      />
      <meta
        property="og:image"
        content="https://rentail.space/images/og-image.png"
      />
      <meta property="og:url" content="https://rentail.space/terms" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Rentail.space" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Terms of Service | Rentail.space" />
      <meta
        name="twitter:description"
        content="Read the Rentail.space Terms of Service: your rights, obligations, and important policies for using our specialty leasing platform."
      />
      <meta
        name="twitter:image"
        content="https://rentail.space/images/og-image.png"
      />
      <link rel="canonical" href="https://rentail.space/terms" />

      <Streamdown
        className="prose prose-lg mx-auto"
        mode="static"
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) =>
            href ? <Link to={href}>{children}</Link> : children,
        }}
      >
        {terms}
      </Streamdown>
    </article>
  );
}
