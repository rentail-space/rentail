import { readFile } from "node:fs/promises";
import path from "node:path";
import dayjs from "dayjs";
import { invariant } from "es-toolkit";
import fm from "front-matter";
import { DateTime } from "luxon";
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
} from "react-router";
import removeMd from "remove-markdown";
import { Streamdown } from "streamdown";
import truncateWords from "~/lib/truncateWords";

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const post = await readFile(
      path.join(process.cwd(), "app/data/blog", `${params.post}.md`),
      "utf8",
    );
    const published = DateTime.fromISO(
      params.post?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
      { zone: "utc" },
    );
    invariant(
      dayjs().isAfter(published.toJSDate()),
      "Published date is in the future",
    );
    return { post, slug: params.post };
  } catch (error) {
    console.error(error);
    throw new Response("Not Found", { status: 404 });
  }
}

export const meta: MetaFunction<typeof loader> = ({ loaderData, params }) => {
  if (!loaderData) return [];

  const published = DateTime.fromISO(
    params.post?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
    { zone: "utc" },
  );
  invariant(
    dayjs().isAfter(published.toJSDate()),
    "Published date is in the future",
  );

  const { attributes } = fm<{ title: string }>(loaderData?.post ?? "");
  return [
    { title: attributes.title },

    // Facebook Meta Tags
    { property: "og:article:author", content: "Rentail Space" },
    { property: "og:article:section", content: "Blog" },
    {
      property: "og:image",
      content: `https://rentail.space/blog/${loaderData.slug}.jpg`,
    },
    {
      property: "og:published_time",
      content: published
        .setZone("UTC")
        .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", { locale: "en-US" }),
    },
    { property: "og:title", content: attributes.title },
    { property: "og:type", content: "article" },
    {
      property: "og:url",
      content: `https://rentail.space/blog/${loaderData.slug}`,
    },
    { property: "og:site_name", content: "Rentail Space" },
    { property: "og:locale", content: "en_US" },

    // Twitter Meta Tags
    { property: "twitter:title", content: attributes.title },
    {
      property: "twitter:url",
      content: `https://rentail.space/blog/${loaderData.slug}`,
    },
    { property: "twitter:card", content: "summary_large_image" },
    {
      property: "twitter:image",
      content: `https://rentail.space/blog/${loaderData.slug}.jpg`,
    },
    { property: "twitter:site", content: "@rentailspace" },
  ];
};

export default function Post() {
  const { post, slug } = useLoaderData<typeof loader>();
  const { attributes, body } = fm<{ title: string }>(post);
  const published = DateTime.fromISO(
    slug?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
    { zone: "utc" },
  );

  return (
    <article className="prose prose-lg mx-auto">
      <h1>{attributes.title}</h1>

      <figure className="relative left-[calc(-50vw+50%)] my-4 w-screen overflow-x-hidden">
        <img
          alt=""
          className="h-[60vh] w-full object-cover"
          src={`/blog/${slug}.jpg`}
        />
      </figure>

      <div className="text-gray-500 text-sm">
        {published.toFormat("LLLL dd, yyyy", { locale: "en-US" })}
      </div>

      <Streamdown
        components={{
          a: ({ children, href }) => (
            <a href={href} className="text-indigo-600 hover:underline">
              {children}
            </a>
          ),
          h1: ({ children }) => (
            <h1 className="font-bold text-2xl">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-bold text-xl">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-bold text-lg">{children}</h3>
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
              className="my-2 h-auto max-h-[400px] w-full object-contain"
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
      </Streamdown>

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `https://rentail.space/blog/${slug}`,
          datePublished: published.toISODate(),
          description: truncateWords(removeMd(body), 50),
          inLanguage: "en-US",
          name: attributes.title,
          primaryImageOfPage: {
            "@id": `https://rentail.space/blog/${slug}.jpg`,
            "@type": "ImageObject",
            contentUrl: new URL(`/blog/${slug}.jpg`, "https://rentail.space"),
            caption: "",
          },
        })}
      </script>
    </article>
  );
}
