import fs from "node:fs";
import path from "node:path";
import fm from "front-matter";
import { useId } from "react";
import { useLoaderData } from "react-router";
import { FeaturesSection } from "~/components/home/FeaturesSection";
import { HeroSection } from "~/components/home/HeroSection";
import { HowItWorksSection } from "~/components/home/HowItWorksSection";
import { Footer } from "~/components/layout/Footer";
import truncateWords from "~/lib/truncateWords";

export async function loader() {
  const dataDir = path.join(process.cwd(), "app/data");
  const posts = fs
    .readdirSync(dataDir)
    .filter((file: string) => file.endsWith(".md"))
    .map((file: string) => fs.readFileSync(path.join(dataDir, file), "utf8"))
    .map((file: string) => ({
      ...fm<{ date: string; title: string }>(file),
      slug: file.replace(".md", ""),
    }))
    .map((file) => ({
      date: new Date(file.attributes.date),
      excerpt: file.body
        .replace(/!\[.*?\]\(.*?\)/g, "")
        .replace(/\[.*?\]\(.*?\)/g, "")
        .replace(/[#*_`]/g, "")
        .replace(/\n+/g, " ")
        .trim(),
      slug: file.slug,
      title: file.attributes.title,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return { posts };
}

export default function Home() {
  const howItWorksId = useId();
  const { posts } = useLoaderData<typeof loader>();
  return (
    <>
      <main className="flex flex-col min-h-screen">
        <HeroSection howItWorksId={howItWorksId} />
        <FeaturesSection />
        <HowItWorksSection howItWorksId={howItWorksId} />

        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            {posts.map((post) => (
              <a
                className="text-lg"
                href={`/blog/${post.slug}`}
                key={post.slug}
              >
                <h2 className="font-bold text-gray-900 mb-4">{post.title}</h2>
                <p className="text-gray-600">
                  {truncateWords(post.excerpt, 30)}
                </p>
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
