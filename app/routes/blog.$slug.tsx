import { HeartIcon } from "lucide-react";
import { DateTime } from "luxon";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import { ActiveLink } from "~/components/ui/ActiveLink";
import LoadingImage from "~/components/ui/LoadingImage";
import { type BlogPost, loadBlogPost } from "~/lib/blogPosts.server";
import externalLink from "~/lib/externalLink";
import type { Route } from "./+types/blog.$slug";

export async function loader({ params }: Route.LoaderArgs): Promise<BlogPost> {
  try {
    const { slug } = params;
    return await loadBlogPost(slug);
  } catch {
    throw new Response("Not Found", { status: 404 });
  }
}

export default function Post({ loaderData }: { loaderData: BlogPost }) {
  const { alt, body, image, slug, published, summary, title } = loaderData;
  const faqItems = parseFAQ(body);
  const url = `https://rentail.space/blog/${slug}`;
  return (
    <main
      className="min-h-screen bg-[hsl(60,100%,99%)] px-4 py-12"
      aria-label={title}
    >
      <title>{`${title} | Rentail.space`}</title>
      <meta name="description" content={summary} />
      <meta name="author" content="Rentail.space" />
      <meta name="section" content="Blog" />
      <meta
        property="og:image"
        content={`https://rentail.space/blog/${slug}.jpg`}
      />
      <meta property="og:published_time" content={published} />
      <meta property="og:title" content={title} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Rentail.space" />
      <meta property="og:description" content={summary} />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={summary} />
      <meta
        name="twitter:image"
        content={`https://rentail.space/blog/${slug}.jpg`}
      />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
      <meta name="yandexbot" content="index, follow" />
      <meta name="duckduckbot" content="index, follow" />
      <meta name="slurp" content="index, follow" />
      <meta name="ia_archiver" content="index, follow" />
      <link rel="canonical" href={url} />

      <article className="prose prose-lg mx-auto max-w-4xl rounded-md border-black bg-white md:border-2 md:p-8 md:shadow-[8px_8px_0px_0px_black]">
        <h1>{title}</h1>

        <LoadingImage
          alt={alt}
          minHeight={300}
          maxHeight={600}
          src={`/blog/${image}`}
        />

        <p className="prose prose-lg mx-auto text-gray-400 text-md italic">
          {summary}
        </p>
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

        <p className="flex items-center gap-2 pt-8 text-gray-500 text-sm">
          <HeartIcon className="h-4 w-4 text-red-500" fill="currentColor" />
          <span>
            Brought to you by{" "}
            <ActiveLink variant="silent" to="https://rentail.space">
              Rentail.space
            </ActiveLink>{" "}
            on{" "}
            {DateTime.fromISO(published, { zone: "utc" }).toLocaleString(
              DateTime.DATE_MED,
            )}
          </span>
        </p>

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Article",
                "@id": url,
                author: {
                  "@type": "Organization",
                  name: "Rentail.space",
                  url: "https://rentail.space",
                },
                datePublished: published,
                inLanguage: "en-US",
                name: title,
                primaryImageOfPage: image
                  ? {
                      "@id": image,
                      "@type": "ImageObject",
                      caption: alt,
                      contentUrl: image,
                    }
                  : undefined,
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
                    name: "Blog",
                    item: "https://rentail.space/blog",
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
        {faqItems && faqItems.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map(({ question, answer }) => ({
                "@type": "Question",
                name: question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: answer,
                },
              })),
            })}
          </script>
        )}
      </article>
    </main>
  );
}

function parseFAQ(body: string): { question: string; answer: string }[] | null {
  const faqMatch = body.match(/## FAQ:?[\s\S]*$/i);
  if (!faqMatch) return null;

  const faqSection = faqMatch[0];
  // Match format: ### question\n\nanswer
  const qaPattern = /###\s+([^\n]+)\n\n((?:(?!###)[\s\S])+?)(?=\n###|$)/gi;
  const matches = [...faqSection.matchAll(qaPattern)];

  if (matches.length === 0) return null;

  return matches.map((match) => ({
    question: match[1].trim(),
    answer: match[2].replaceAll(/\n/g, " ").trim(),
  }));
}
