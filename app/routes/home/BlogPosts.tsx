import type { FrontMatterResult } from "front-matter";
import { Link } from "react-router";
import removeMd from "remove-markdown";
import truncateWords from "~/lib/truncateWords";

export type FrontMatter = {
  added: Date;
  image?: { alt: string; src: string };
  title: string;
};

export default function BlogPosts({
  posts,
}: {
  posts: (FrontMatterResult<FrontMatter> & { slug: string })[];
}) {
  return (
    <section className="prose prose-lg mx-auto">
      {posts.map((post) => (
        <Link
          className="link link-hover flex flex-row gap-4"
          to={`/blog/${post.slug}`}
          key={post.slug}
        >
          <img
            src={post.attributes.image?.src}
            alt={post.attributes.image?.alt}
            width={100}
            height={100}
            className="w-24 h-24 object-cover rounded-lg border border-gray-200 mt-12"
          />
          <div>
            <h3>{post.attributes.title}</h3>
            <p>{truncateWords(removeMd(post.body), 30)}</p>
          </div>
        </Link>
      ))}
    </section>
  );
}
