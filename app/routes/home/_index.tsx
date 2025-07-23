import fs from "node:fs";
import path from "node:path";
import fm from "front-matter";
import { useId } from "react";
import { useLoaderData } from "react-router";
import { Footer } from "~/components/layout/Footer";
import BlogPosts from "./BlogPosts";
import FeaturesSection from "./FeaturesSection";
import HeroSection from "./HeroSection";
import HowItWorksSection from "./HowItWorksSection";
import SpecialtyLeasing from "./SpecialtyLeasing";

export async function loader() {
  const dataDir = path.join(process.cwd(), "app/data");
  const posts = fs
    .readdirSync(dataDir)
    .filter((filename: string) => filename.endsWith(".md"))
    .map((filename: string) => ({
      content: fs.readFileSync(path.join(dataDir, filename), "utf8"),
      filename,
    }))
    .map(({ filename, content }) => ({
      ...fm<{ date: string; title: string }>(content),
      slug: filename.replace(".md", ""),
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
      <main className="flex flex-col min-h-screen gap-y-20 mb-20">
        <HeroSection howItWorksId={howItWorksId} />
        <FeaturesSection />
        <HowItWorksSection howItWorksId={howItWorksId} />
        <BlogPosts posts={posts} />
        <SpecialtyLeasing />
      </main>
      <Footer />
    </>
  );
}
