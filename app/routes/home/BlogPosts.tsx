import dayjs from "dayjs";
import { drop, take } from "es-toolkit";
import type { FrontMatterResult } from "front-matter";
import { IconChevronRight } from "obra-icons-react";
import { Link } from "react-router";
import removeMd from "remove-markdown";

export default function BlogPosts({
  posts,
}: {
  posts: (FrontMatterResult<{ title: string }> & {
    slug: string;
    published: Date;
    alt?: string;
    image?: string;
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
          className="link link-hover line-clamp-2 flex flex-row gap-4"
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
            <h4>{post.attributes.title}</h4>
            <p className="line-clamp-3 text-gray-500">{removeMd(post.body)}</p>
          </div>
        </Link>
      ))}

      {rest.map((post) => (
        <Link
          className="link link-hover line-clamp-1"
          key={post.slug}
          to={`/blog/${post.slug}`}
        >
          <h5 className="flex flex-row flex-nowrap items-center gap-2">
            <IconChevronRight className="mr-2 inline-block h-4 w-4" />
            <span>{post.attributes.title}</span>
          </h5>
        </Link>
      ))}
    </section>
  );
}
