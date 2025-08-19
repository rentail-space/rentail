import dayjs from "dayjs";
import { drop, take } from "es-toolkit";
import type { FrontMatterResult } from "front-matter";
import { DateTime } from "luxon";
import { Link } from "react-router";
import removeMd from "remove-markdown";
import truncateWords from "~/lib/truncateWords";

export default function BlogPosts({
  posts,
}: {
  posts: (FrontMatterResult<{ title: string }> & { slug: string })[];
}) {
  const today = dayjs();
  const isPublished = posts.filter((post) =>
    today.isAfter(
      DateTime.fromISO(
        post.slug.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
      ).toJSDate(),
    ),
  );
  const first = take(isPublished, 3);
  const rest = drop(isPublished, 3);

  return (
    <section className="prose prose-lg mx-auto">
      {first.map((post) => (
        <Link
          className="link link-hover flex flex-row gap-4"
          to={`/blog/${post.slug}`}
          key={post.slug}
        >
          <img
            alt=""
            className="mt-12 h-24 w-24 rounded-lg border border-gray-200 object-cover"
            height={100}
            src={`/blog/${post.slug}.jpg`}
            width={100}
          />
          <div>
            <h3>{post.attributes.title}</h3>
            <p>{truncateWords(removeMd(post.body), 30)}</p>
          </div>
        </Link>
      ))}

      {rest.map((post) => (
        <Link
          className="link link-hover"
          to={`/blog/${post.slug}`}
          key={post.slug}
        >
          <h4>{post.attributes.title}</h4>
          <p className="hidden">{truncateWords(removeMd(post.body), 30)}</p>
        </Link>
      ))}
    </section>
  );
}
