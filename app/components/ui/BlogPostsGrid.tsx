import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import type { BlogPost } from "~/lib/blogPosts.server";
import BlogPostCard from "./BlogPostCard";

export default function BlogPostsGrid({
  className,
  posts,
  limit,
}: {
  className?: string;
  posts: BlogPost[];
  limit?: number;
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
            {posts.slice(0, limit || Infinity).map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
            {limit && posts.length > limit && (
              <div className="col-span-full text-center">
                <Link
                  to="/blog"
                  className="flex flex-row flex-nowrap gap-2 items-center justify-center font-medium text-black text-xl hover:text-[hsl(37,92%,65%)]"
                >
                  See all blog posts <ArrowRight className="h-6 w-6" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
