import type {
  LoaderFunctionArgs,
  ShouldRevalidateFunction,
} from "react-router";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import { type BlogPost, loadBlogPost } from "~/lib/blogPosts.server";

export async function loader({
  params,
}: LoaderFunctionArgs<{ post: string }>): Promise<BlogPost> {
  try {
    return await loadBlogPost(params.post);
  } catch (error) {
    console.error(error);
    throw new Response("Not Found", { status: 404 });
  }
}

export const shouldRevalidate: ShouldRevalidateFunction = () => false;

export default function Post({ loaderData }: { loaderData: BlogPost }) {
  const { alt, body, image, slug, published, summary, title } = loaderData;

  return (
    <article className="prose prose-lg mx-auto">
      <title>{title}</title>
      <meta name="author" content="Rentail Space" />
      <meta name="section" content="Blog" />
      <meta
        name="og:image"
        content={`https://rentail.space/blog/${slug}.jpg`}
      />
      <meta name="og:published_time" content={published.toISOString()} />
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

      <h1>{title}</h1>

      {image && (
        <figure className="relative left-[calc(-50vw+50%)] my-4 w-screen overflow-x-hidden">
          <img alt={alt} className="h-[60vh] w-full object-cover" src={image} />
        </figure>
      )}

      <Streamdown
        className="prose prose-lg mx-auto"
        remarkPlugins={[remarkGfm]}
      >
        {body}
      </Streamdown>

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `https://rentail.space/blog/${slug}`,
          datePublished: published,
          description: summary,
          inLanguage: "en-US",
          name: title,
          primaryImageOfPage: {
            "@id": `https://rentail.space/blog/${slug}.jpg`,
            "@type": "ImageObject",
            contentUrl: new URL(`/blog/${slug}.jpg`, "https://rentail.space"),
            caption: alt,
          },
        })}
      </script>
    </article>
  );
}
