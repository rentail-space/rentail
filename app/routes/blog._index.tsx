import BlogPostsGrid from "~/components/ui/BlogPostsGrid";
import type { BlogPost } from "~/lib/blogPosts.server";
import { recentBlogPosts } from "~/lib/blogPosts.server";

export const handle = { showHeader: true, showFooter: true };

export async function loader() {
  const posts = await recentBlogPosts();
  return { posts };
}

export default function Blog({
  loaderData,
}: {
  loaderData: { posts: BlogPost[] };
}) {
  return (
    <main
      className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]"
      aria-label="Blog"
    >
      <title>Blog - Specialty Leasing & Retail Spaces | Rentail.space</title>
      <meta
        name="description"
        content="Discover tips, insights, and real-world success stories to help retail entrepreneurs thrive—specialty leasing ideas, marketing, and more."
      />
      <meta
        name="keywords"
        content="blog, specialty leasing, retail spaces, rentail.space"
      />
      <link rel="canonical" href="https://rentail.space/blog" />

      <section className="bg-[hsl(60,100%,99%)] px-4 py-20 md:py-32">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="mb-6 font-bold text-5xl text-black leading-tight md:text-6xl">
            Blog
          </h1>
          <p className="font-medium text-black text-xl leading-relaxed md:text-2xl">
            Tips, insights, and success stories for retail entrepreneurs
          </p>
        </div>
      </section>

      <BlogPostsGrid
        className="bg-[hsl(60,100%,99%)]"
        posts={loaderData.posts}
      />
    </main>
  );
}
