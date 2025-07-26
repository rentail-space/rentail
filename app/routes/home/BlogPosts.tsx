import type { FrontMatterResult } from "front-matter";
import { Link } from "react-router";
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
          className="link link-hover"
          to={`/blog/${post.slug}`}
          key={post.slug}
        >
          <h3>{post.attributes.title}</h3>
          <p>{truncateWords(getExcerpt(post.body), 30)}</p>
        </Link>
      ))}
    </section>
  );
}

function getExcerpt(body: string) {
  return body
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "")
    .replace(/[#*_`]/g, "")
    .replace(/\n+/g, " ")
    .trim();
}
