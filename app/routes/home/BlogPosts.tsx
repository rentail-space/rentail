import { Link } from "react-router";
import truncateWords from "~/lib/truncateWords";

export type FrontMatter = {
  added: string;
  image?: { alt: string; src: string };
  title: string;
};

export default function BlogPosts({
  posts,
}: {
  posts: (FrontMatter & { slug: string; excerpt: string })[];
}) {
  return (
    <section className="prose prose-lg mx-auto">
      {posts.map((post) => (
        <Link
          className="link link-hover"
          to={`/blog/${post.slug}`}
          key={post.slug}
        >
          <h2>{post.title}</h2>
          <p>{truncateWords(post.excerpt, 30)}</p>
        </Link>
      ))}
    </section>
  );
}
