import fs from "node:fs";
import path from "node:path";
import fm from "front-matter";
import { useId } from "react";
import { useLoaderData } from "react-router";
import { Footer } from "~/components/layout/Footer";
import BlogPosts, { type FrontMatter } from "./BlogPosts";
import FeaturesSection from "./FeaturesSection";
import HeroSection from "./HeroSection";
import HowItWorksSection from "./HowItWorksSection";
import SpecialtyLeasing from "./SpecialtyLeasing";

export async function loader() {
  const dataDir = path.join(process.cwd(), "app/data/blog");
  const posts = fs
    .readdirSync(dataDir)
    .filter((filename: string) => filename.endsWith(".md"))
    .map((filename: string) => ({
      content: fs.readFileSync(path.join(dataDir, filename), "utf8"),
      filename,
    }))
    .map(({ filename, content }) => ({
      ...fm<FrontMatter>(content),
      slug: filename.replace(".md", ""),
    }))
    .sort(
      (a, b) =>
        new Date(b.attributes.added).getTime() -
        new Date(a.attributes.added).getTime(),
    );
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
