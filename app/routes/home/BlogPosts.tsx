import dayjs from "dayjs";
import { drop, take } from "es-toolkit";
import type { FrontMatterResult } from "front-matter";
import { Link } from "react-router";
import removeMd from "remove-markdown";

export default function BlogPosts({
  posts,
}: {
  posts: (FrontMatterResult<{ title: string }> & {
    slug: string;
    published: Date;
    alt?: string;
  })[];
}) {
  const today = dayjs();
  const isPublished = posts.filter((post) => today.isAfter(post.published));
  const first = take(isPublished, 3);
  const rest = drop(isPublished, 3);

  return (
    <section className="blog-posts-section flex flex-col gap-y-2">
      {first.map((post) => (
        <Link
          className="link link-hover flex flex-row gap-4 line-clamp-2"
          key={post.slug}
          to={`/blog/${post.slug}`}
        >
          <img
            alt={post.alt}
            className="mt-10 h-24 w-24 rounded-lg border border-gray-200 object-cover"
            height={100}
            src={`/blog/${post.slug}.jpg`}
            width={100}
          />
          <div>
            <h4>{post.attributes.title}</h4>
            <p className="text-gray-500 line-clamp-3">{removeMd(post.body)}</p>
          </div>
        </Link>
      ))}

      {rest.map((post) => (
        <Link
          className="link link-hover line-clamp-1"
          key={post.slug}
          to={`/blog/${post.slug}`}
        >
          <h5 className="flex flex-row items-start flex-nowrap gap-2">
            <ArrowIcon className="ml-3 mt-3 h-3 w-3 flex-shrink-0" />
            {post.attributes.title}
          </h5>
        </Link>
      ))}
    </section>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`${className} inline-block`}
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 4L10 8L6 12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
