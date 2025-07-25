import fm from "front-matter";
import Markdown from "react-markdown";
import {
  type LoaderFunctionArgs,
  type Params,
  useLoaderData,
} from "react-router";
import Layout from "~/components/layout/Layout";
import type { FrontMatter } from "./home/BlogPosts";

export async function loader({ params }: LoaderFunctionArgs) {
  const post = await loadFile(params);
  return { post };
}

async function loadFile(params: Params<string>) {
  const { "*": slug } = params;
  try {
    const post = await import(`../data/blog/${slug}.md?raw`);
    return post.default;
  } catch {
    throw new Response("Not Found", { status: 404 });
  }
}

export default function Post() {
  const { post } = useLoaderData<typeof loader>();
  const { attributes, body } = fm<FrontMatter>(post);
  return (
    <Layout>
      <article className="prose prose-lg mx-auto">
        <h1>{attributes.title}</h1>

        {attributes.image && (
          <figure className="relative left-[calc(-50vw+50%)] my-4 overflow-x-hidden w-screen">
            <img
              alt={attributes.image.alt}
              className="w-full h-[60vh] object-cover"
              src={attributes.image.src}
            />
          </figure>
        )}

        <div className="text-sm text-gray-500">
          {new Date(attributes.added).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>

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
            img: ({
              src,
              alt,
              ...props
            }: React.ImgHTMLAttributes<HTMLImageElement>) => (
              <img
                alt={alt}
                className="w-full h-auto max-h-[400px] object-contain my-2"
                src={src}
                {...props}
              />
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
          {body}
        </Markdown>
      </article>
    </Layout>
  );
}
