import { invariant } from "es-toolkit";
import { DateTime } from "luxon";
import { Link } from "react-router";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import { ActiveLink } from "~/components/ui/ActiveLink";
import externalLink from "~/lib/externalLink";
import { type NewsItem, loadNewsItem } from "~/lib/newsItems.server";
import pageMeta from "~/lib/pageMeta";
import type { Route } from "./+types/news.$slug";

export async function loader({ params }: Route.LoaderArgs): Promise<NewsItem> {
  try {
    const { slug } = params;
    invariant(slug, "Slug is required");
    return await loadNewsItem(slug);
  } catch {
    throw new Response("Not Found", { status: 404 });
  }
}

export function meta({ data }: Route.MetaArgs): Route.MetaDescriptors {
  if (!data) return [];
  const { slug, published, summary, title } = data;
  return [
    ...pageMeta({
      title: `${title} | Rentail.space`,
      description: summary,
      url: `/news/${slug}`,
      keywords: "news, rentail.space, retail industry, specialty leasing",
      ogType: "article",
      author: "Rentail.space",
    }),
    { name: "section", content: "News" },
    { property: "og:published_time", content: published },
    { name: "robots", content: "index, follow" },
    { name: "googlebot", content: "index, follow" },
    { name: "bingbot", content: "index, follow" },
    { name: "yandexbot", content: "index, follow" },
    { name: "duckduckbot", content: "index, follow" },
    { name: "slurp", content: "index, follow" },
    { name: "ia_archiver", content: "index, follow" },
  ];
}

export default function NewsPost({ loaderData }: { loaderData: NewsItem }) {
  const { body, slug, published, summary, title } = loaderData;
  const url = `https://rentail.space/news/${slug}`;

  return (
    <main
      className="min-h-screen bg-[hsl(60,100%,99%)] px-4 py-12"
      aria-label={title}
    >
      <article className="prose prose-lg mx-auto max-w-4xl rounded-md border-black bg-white md:border-2 md:p-8 md:shadow-[8px_8px_0px_0px_black]">
        <h1>{title}</h1>

        <Streamdown
          className="prose prose-lg mx-auto"
          components={{
            a: ({ children, href }) => (
              <ActiveLink
                rel="noopener"
                target="_blank"
                to={externalLink(href ?? "")}
              >
                {children}
              </ActiveLink>
            ),
          }}
          controls={{ code: false, mermaid: false, table: false }}
          mode="static"
          remarkPlugins={[remarkGfm]}
        >
          {body}
        </Streamdown>

        <section className="mt-10 text-gray-400 text-md italic">
          <p>
            Rentail.space is an AI-powered marketplace connecting businesses
            with short-term retail spaces in shopping centers. By combining
            intelligent matching algorithms with comprehensive property data,
            the platform streamlines specialty lease discovery and placement.
            For more information, visit
            <ActiveLink to="https://rentail.space">
              https://rentail.space
            </ActiveLink>
          </p>

          <h3>Media Contact</h3>
          <dl
            className="grid gap-2 [&_dd]:my-0 [&_dd]:text-black [&_dt]:my-0 [&_dt]:font-bold"
            style={{ gridTemplateColumns: "2rem 1fr" }}
          >
            <dt>Name</dt>
            <dd>Assaf Arkin</dd>
            <dt>Title</dt>
            <dd>CEO</dd>
            <dt>Email</dt>
            <dd>
              <Link to="mailto:media@rentail.space">media@rentail.space</Link>
            </dd>
            <dt>Phone</dt>
            <dd>
              <a href="tel:4156831143">415-683-1143</a>
            </dd>
          </dl>
        </section>

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "NewsArticle",
                "@id": url,
                author: {
                  "@type": "Organization",
                  name: "Rentail.space",
                  url: "https://rentail.space",
                },
                dateline: `LOS ANGELES, CA — ${DateTime.fromISO(published, { zone: "utc" }).toLocaleString(DateTime.DATE_MED)}`,
                datePublished: published,
                headline: summary,
                inLanguage: "en-US",
                name: title,
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: "https://rentail.space",
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "News",
                    item: "https://rentail.space/news",
                  },
                  {
                    "@type": "ListItem",
                    position: 3,
                    name: title,
                    item: url,
                  },
                ],
              },
            ],
          })}
        </script>
      </article>
    </main>
  );
}
