import { redirect } from "react-router";
import { Link } from "react-router";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import terms from "~/data/terms.md?raw";
import pageMeta from "~/lib/pageMeta";
import type { Route } from "./+types/terms";

export function meta(): Route.MetaDescriptors {
  return [
    ...pageMeta({
      title: "Terms of Service",
      description:
        "Read the Rentail.space Terms of Service: your rights, obligations, and important policies for using our specialty leasing platform.",
      url: "/terms",
      keywords:
        "terms of service, specialty leasing, retail spaces, rentail.space",
    }),
    {
      tagName: "link",
      href: "https://rentail.space/terms.md",
      rel: "alternate",
      type: "text/markdown",
      title: "Markdown version",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  if (request.headers.get("accept")?.split(",")[0] === "text/markdown")
    return redirect("/terms.md", { status: 303 });
  return null;
}

export function headers(): HeadersInit {
  return {
    Link: `<https://rentail.space/terms.md>; rel="alternate"; type="text/markdown"`,
  };
}

export default function TermsOfService() {
  return (
    <article className="container mx-auto my-10 max-w-4xl space-y-8 p-5">
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
