import { readFileSync } from "node:fs";
import { join } from "node:path";
import Markdown from "react-markdown";
import { useParams } from "react-router";
import { Footer } from "~/components/layout/Footer";

export default function Post() {
  const { "*": slug } = useParams();
  const post = readFileSync(
    join(import.meta.dirname, `../data/${slug}.md`),
    "utf8",
  );
  if (!post) throw new Response("Not Found", { status: 404 });
  return (
    <>
      <article className="flex flex-col gap-2 p-4 md:p-8">
        <Markdown
          components={{
            a: ({ children, href }) => (
              <a href={href} className="text-blue-500">
                {children}
              </a>
            ),
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-bold">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-bold">{children}</h3>
            ),
            hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
              <hr className="border-gray-300" {...props} />
            ),
            li: ({ children }) => <li className="ml-4">{children}</li>,
            ol: ({
              children,
              ...props
            }: React.HTMLAttributes<HTMLOListElement>) => (
              <ol className="ml-8 list-decimal" {...props}>
                {children}
              </ol>
            ),
            p: ({ children }) => <p className="text-lg">{children}</p>,
            ul: ({
              children,
              ...props
            }: React.HTMLAttributes<HTMLUListElement>) => (
              <ul className="ml-6 list-disc" {...props}>
                {children}
              </ul>
            ),
          }}
        >
          {post}
        </Markdown>
      </article>
      <Footer />
    </>
  );
}
