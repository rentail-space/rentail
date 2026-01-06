import { ArrowRight, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import { Link } from "react-router";
import type { BlogPost } from "~/lib/blogPosts.server";
import { cn } from "~/lib/utils";
import { ActiveLink } from "./ActiveLink";
import LoadingImage from "./LoadingImage";

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
            {posts.slice(0, limit).map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
            {limit && posts.length > limit && (
              <div className="col-span-full text-center">
                <ActiveLink to="/blog" variant="highlight">
                  Explore all blog posts <ArrowRight className="h-6 w-6" />
                </ActiveLink>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className={cn(
        "flex flex-col overflow-hidden rounded-md border-2 border-black bg-white shadow-[4px_4px_0px_0px_black] transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black]",
        "rounded-md border-2 border-black bg-white shadow-[4px_4px_0px_0px_black]",
        "transform transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:rotate-1 hover:shadow-[6px_6px_0px_0px_black]",
      )}
    >
      <LoadingImage
        alt={post.alt}
        figureClassName="border-b-2 border-black"
        maxHeight={200}
        src={`/blog/${post.image}`}
      />
      <div className="flex h-60 flex-col justify-between gap-3 p-6">
        <div>
          <time
            dateTime={post.published.toISOString()}
            className="text-gray-500 text-sm"
          >
            {DateTime.fromJSDate(post.published, {
              zone: "utc",
            }).toLocaleString(DateTime.DATE_MED)}
          </time>
          <h2 className="line-clamp-2 font-bold text-black text-xl group-hover:text-[hsl(37,92%,65%)]">
            {post.title}
          </h2>
        </div>
        <p className="line-clamp-3 font-medium text-black text-sm">
          {post.summary}
        </p>
        <div className="flex items-center gap-2 font-bold text-[hsl(37,92%,65%)] text-sm">
          <span>Read more</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
