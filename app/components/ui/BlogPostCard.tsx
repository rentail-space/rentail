import { ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import { Link } from "react-router";
import type { BlogPost } from "~/lib/blogPosts.server";

export default function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-500 hover:shadow-xl"
    >
      {post.image ? (
        <div className="aspect-video w-full overflow-hidden">
          <img
            alt={post.alt}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            src={`/blog/${post.image}`}
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-linear-to-br from-blue-100 to-indigo-100" />
      )}
      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-center gap-2 text-gray-500 text-xs">
          <time dateTime={post.published.toISOString()}>
            {DateTime.fromJSDate(post.published, {
              zone: "utc",
            }).toLocaleString(DateTime.DATE_MED)}
          </time>
        </div>
        <h2 className="line-clamp-2 font-bold text-gray-900 text-xl group-hover:text-blue-600">
          {post.title}
        </h2>
        <p className="line-clamp-3 text-gray-600 text-sm">{post.summary}</p>
        <div className="mt-2 flex items-center gap-2 font-medium text-blue-600 text-sm">
          <span>Read more</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
