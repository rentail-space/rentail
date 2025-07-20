import fm from "front-matter";
import Markdown from "react-markdown";
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
} from "react-router";
import { Footer } from "~/components/layout/Footer";
import guide from "~/data/ultimate-guide.md?raw";

export async function loader({ params }: LoaderFunctionArgs) {
  const { "*": slug } = params;
  const post = slug === "ultimate-guide" ? guide : null;
  if (!post) throw new Response("Not Found", { status: 404 });
  return { post };
}

export const meta: MetaFunction = ({ params }) => {
  const { "*": slug } = params;
  const post = slug === "ultimate-guide" ? guide : null;
  const { attributes } = fm<{ title: string }>(post ?? "");
  return [{ title: attributes.title ?? "rentail.space" }];
};

export default function Post() {
  const { post } = useLoaderData<typeof loader>();
  const { attributes, body } = fm<{
    image?: { alt: string; src: string };
    title: string;
  }>(post);
  return (
    <div className="p-4 md:p-8">
      <header className="mb-2">
        <h1 className="text-2xl font-bold">{attributes.title}</h1>
      </header>
      {attributes.image && (
        <figure className="relative left-[calc(-50vw+50%)] my-4 overflow-x-hidden w-screen">
          <img
            alt={attributes.image.alt}
            className="w-full h-[60vh] object-cover"
            src={attributes.image.src}
          />
        </figure>
      )}
      <article className="flex flex-col gap-2">
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
      <Footer />
    </div>
  );
}
