import truncateWords from "~/lib/truncateWords";

export default function BlogPosts({
  posts,
}: {
  posts: { slug: string; title: string; excerpt: string }[];
}) {
  return (
    <section>
      <div className="container mx-auto px-4">
        {posts.map((post) => (
          <a className="text-lg" href={`/blog/${post.slug}`} key={post.slug}>
            <h2 className="font-bold text-gray-900 mb-4">{post.title}</h2>
            <p className="text-gray-600">{truncateWords(post.excerpt, 30)}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
