import { ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import { Link } from "react-router";
import type { BlogPost } from "~/lib/blogPosts.server";

export default function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex transform flex-col overflow-hidden rounded-md border-2 border-black bg-white shadow-[4px_4px_0px_0px_black] transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black]"
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
        <div className="aspect-video w-full bg-[hsl(47,100%,95%)]" />
      )}
      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-center gap-2 font-medium text-black text-xs">
          <time dateTime={post.published.toISOString()}>
            {DateTime.fromJSDate(post.published, {
              zone: "utc",
            }).toLocaleString(DateTime.DATE_MED)}
          </time>
        </div>
        <h2 className="line-clamp-2 font-bold text-black text-xl group-hover:text-[hsl(37,92%,65%)]">
          {post.title}
        </h2>
        <p className="line-clamp-3 font-medium text-black text-sm">
          {post.summary}
        </p>
        <div className="mt-2 flex items-center gap-2 font-bold text-[hsl(37,92%,65%)] text-sm">
          <span>Read more</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
