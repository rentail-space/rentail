import type { BlogPost } from "~/lib/blogPosts.server";
import BlogPostCard from "./BlogPostCard";

export default function BlogPostsGrid({
  className,
  posts,
}: {
  className?: string;
  posts: BlogPost[];
}) {
  return (
    <section
      className={`blog-posts px-4 py-20${className ? ` ${className}` : ""}`}
    >
      <div className="container mx-auto max-w-7xl">
        {posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-medium text-black text-xl">
              No blog posts published yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
