import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import type { BlogPost } from "~/lib/blogPosts.server";

export default function BlogListing({ posts }: { posts: BlogPost[] }) {
  return (
    <section className="blog-posts-section flex flex-col gap-y-2">
      {posts.slice(0, 3).map((post) => (
        <Link
          className="link link-hover line-clamp-2 flex flex-row gap-4 no-underline"
          key={post.slug}
          to={`/blog/${post.slug}`}
        >
          {post.image ? (
            <img
              alt={post.alt}
              className="mt-10 h-24 w-24 rounded-lg border border-gray-200 object-cover"
              height={100}
              src={`/blog/${post.image}`}
              width={100}
            />
          ) : (
            <span />
          )}
          <div>
            <h4>{post.title}</h4>
            <p className="line-clamp-3 text-gray-500">{post.summary}</p>
          </div>
        </Link>
      ))}

      {posts.slice(3).map((post) => (
        <Link
          className="link link-hover line-clamp-1 no-underline"
          key={post.slug}
          to={`/blog/${post.slug}`}
        >
          <h5 className="flex flex-row flex-nowrap items-center gap-2">
            <ChevronRight className="mr-2 inline-block h-4 w-4" />
            <span>{post.title}</span>
          </h5>
        </Link>
      ))}
    </section>
  );
}
