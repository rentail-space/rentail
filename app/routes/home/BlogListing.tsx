import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import type { BlogPost } from "~/lib/blogPosts.server";

export default function BlogListing({ posts }: { posts: BlogPost[] }) {
  return (
    <section className="bg-gray-50 px-4 py-20">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-4xl text-gray-900">
            Latest from our blog
          </h2>
          <p className="text-gray-600 text-xl">
            Tips, insights, and success stories for retail entrepreneurs
          </p>
        </div>
        <Listing posts={posts} />
      </div>
    </section>
  );
}

function Listing({ posts }: { posts: BlogPost[] }) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {posts.slice(0, 3).map((post) => (
        <Link
          className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-500 hover:shadow-xl"
          key={post.slug}
          to={`/blog/${post.slug}`}
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
            <h3 className="line-clamp-2 font-bold text-gray-900 text-xl group-hover:text-blue-600">
              {post.title}
            </h3>
            <p className="line-clamp-3 text-gray-600 text-sm">{post.summary}</p>
            <div className="mt-2 flex items-center gap-2 font-medium text-blue-600 text-sm">
              <span>Read more</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      ))}

      {posts.slice(3).map((post) => (
        <Link
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-500 hover:shadow-md"
          key={post.slug}
          to={`/blog/${post.slug}`}
        >
          <ChevronRight className="h-5 w-5 shrink-0 text-blue-600 transition-transform group-hover:translate-x-1" />
          <h4 className="line-clamp-2 font-semibold text-gray-900 text-sm group-hover:text-blue-600">
            {post.title}
          </h4>
        </Link>
      ))}
    </div>
  );
}
