import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";
import type { BlogPost } from "~/lib/blogPosts.server";
import { recentNewsItems } from "~/lib/newsItems.server";
import pageMeta from "~/lib/pageMeta";
import type { Route } from "./+types/news._index";

export function meta(): Route.MetaDescriptors {
  return pageMeta({
    title: "News",
    description: "Discover the latest news and updates from Rentail.space.",
    url: "/news",
    keywords: "news, rentail.space, retail spaces, specialty leasing",
  });
}

export async function loader() {
  const posts = await recentNewsItems();
  return { posts };
}

export default function News({
  loaderData,
}: {
  loaderData: { posts: BlogPost[] };
}) {
  return (
    <main
      className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]"
      aria-label="News"
    >
      <script
        type="application/ld+json"
        // oxlint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Rentail.space News",
            description: "The latest news and updates from Rentail.space",
            url: "https://rentail.space/news",
            mainEntity: {
              "@type": "ItemList",
              itemListElement: loaderData.posts.map((post, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "NewsArticle",
                  "@id": `https://rentail.space/news/${post.slug}`,
                  headline: post.title,
                  description: post.summary,
                  datePublished: post.published,
                  url: `https://rentail.space/news/${post.slug}`,
                  author: {
                    "@type": "Organization",
                    name: "Rentail.space",
                    url: "https://rentail.space",
                  },
                },
              })),
            },
          }),
        }}
      />

      <section className="bg-[hsl(60,100%,99%)] px-4 py-20 md:py-32">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="mb-6 font-bold text-5xl text-black leading-tight md:text-6xl">
            News
          </h1>
          <p className="font-medium text-black text-xl leading-relaxed md:text-2xl">
            The latest news and updates from Rentail.space
          </p>
        </div>
      </section>

      <section>
        <div className="container mx-auto max-w-4xl">
          {loaderData.posts.map((post) => (
            <Link key={post.slug} to={`/news/${post.slug}`}>
              <div className="flex flex-col gap-2">
                <h2 className="font-bold text-black text-xl">{post.title}</h2>
                <p className="text-gray-500">{post.summary}</p>
                <p className="flex items-center gap-1 text-blue-500">
                  <span className="font-bold">Read more</span>
                  <ArrowRightIcon className="h-4 w-4" fill="currentColor" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
