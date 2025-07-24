import { Link } from "react-router";
import truncateWords from "~/lib/truncateWords";

export default function BlogPosts({
  posts,
}: {
  posts: { slug: string; title: string; excerpt: string }[];
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
