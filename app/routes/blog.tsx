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
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-linear-to-br from-blue-50 via-white to-indigo-50 px-4 py-20 md:py-32">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="mb-6 font-bold text-5xl text-gray-900 md:text-6xl">
            Blog
          </h1>
          <p className="text-gray-600 text-xl md:text-2xl">
            Tips, insights, and success stories for retail entrepreneurs
          </p>
        </div>
      </section>

      <BlogPostsGrid posts={loaderData.posts} />
    </main>
  );
}
