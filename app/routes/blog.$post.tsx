import { readFile } from "node:fs/promises";
import path from "node:path";
import dayjs from "dayjs";
import { invariant } from "es-toolkit";
import fm from "front-matter";
import { DateTime } from "luxon";
import { type LoaderFunctionArgs, useLoaderData } from "react-router";
import removeMd from "remove-markdown";
import { Streamdown } from "streamdown";
import truncateWords from "~/lib/truncateWords";
import { validateParam } from "./blog.$post[.]jpg";

export async function loader({
  params,
}: LoaderFunctionArgs<{ post: string }>): Promise<{
  post: string;
  slug: string;
}> {
  try {
    const postName = validateParam(params);
    const post = await readFile(
      path.join(process.cwd(), "app/data/blog", `${postName}.md`),
      "utf8",
    );
    const published = DateTime.fromISO(
      postName?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
      { zone: "utc" },
    );
    invariant(
      dayjs().isAfter(published.toJSDate()),
      "Published date is in the future",
    );
    return { post, slug: postName };
  } catch (error) {
    console.error(error);
    throw new Response("Not Found", { status: 404 });
  }
}

export default function Post() {
  const { post, slug } = useLoaderData<typeof loader>();
  const { attributes, body } = fm<{ title: string }>(post);
  const published = DateTime.fromISO(
    slug?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
    { zone: "utc" },
  );

  return (
    <article className="prose prose-lg mx-auto">
      <MetaTags title={attributes.title} published={published} slug={slug} />

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
          hr: () => <hr className="border-gray-300" />,
          img: ({ src, alt }) => (
            <img
              alt={alt}
              className="my-2 h-auto max-h-[400px] w-full object-contain"
              src={src}
            />
          ),
          li: ({ children }) => <li className="ml-4">{children}</li>,
          ol: ({ children }) => (
            <ol className="ml-8 list-decimal">{children}</ol>
          ),
          p: ({ children }) => <p className="text-lg">{children}</p>,
          ul: ({ children }) => <ul className="ml-6 list-disc">{children}</ul>,
        }}
      >
        {body}
      </Streamdown>

      <JSONLD
        body={body}
        published={published}
        slug={slug}
        title={attributes.title}
      />
    </article>
  );
}

function JSONLD({
  body,
  published,
  slug,
  title,
}: {
  body: string;
  published: DateTime;
  slug: string;
  title: string;
}) {
  return (
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `https://rentail.space/blog/${slug}`,
        datePublished: published.toISODate(),
        description: truncateWords(removeMd(body), 50),
        inLanguage: "en-US",
        name: title,
        primaryImageOfPage: {
          "@id": `https://rentail.space/blog/${slug}.jpg`,
          "@type": "ImageObject",
          contentUrl: new URL(`/blog/${slug}.jpg`, "https://rentail.space"),
          caption: "",
        },
      })}
    </script>
  );
}

function MetaTags({
  published,
  slug,
  title,
}: {
  published: DateTime;
  slug: string;
  title: string;
}) {
  return (
    <>
      <title>{title}</title>
      <meta name="author" content="Rentail Space" />
      <meta name="section" content="Blog" />
      <meta
        name="og:image"
        content={`https://rentail.space/blog/${slug}.jpg`}
      />
      <meta
        name="og:published_time"
        content={published.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", {
          locale: "en-US",
        })}
      />
      <meta name="og:title" content={title} />
      <meta name="og:type" content="article" />
      <meta name="og:url" content={`https://rentail.space/blog/${slug}`} />
      <meta name="og:site_name" content="Rentail Space" />
      <meta name="og:locale" content="en_US" />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
      <meta name="yandexbot" content="index, follow" />
      <meta name="duckduckbot" content="index, follow" />
      <meta name="slurp" content="index, follow" />
      <meta name="ia_archiver" content="index, follow" />
      <meta name="ia_archiver" content="index, follow" />
    </>
  );
}
