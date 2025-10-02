import fs from "node:fs";
import path from "node:path";
import dayjs from "dayjs";
import fm from "front-matter";
import { DateTime } from "luxon";
import { useId } from "react";
import { useLoaderData } from "react-router";
import Footer from "~/components/layout/Footer";
import BlogPosts from "~/routes/home/BlogPosts";
import FeaturesSection from "~/routes/home/FeaturesSection";
import HeroSection from "~/routes/home/HeroSection";
import HowItWorksSection from "~/routes/home/HowItWorksSection";
import JoinWaitlist from "~/routes/home/JoinWaitlist";
import SpecialtyLeasing from "~/routes/home/SpecialtyLeasing";

export const handle = { hideLayout: true };

export async function loader() {
  const dataDir = path.join(process.cwd(), "app/data/blog");
  const today = dayjs();
  const posts = fs
    .readdirSync(dataDir)
    .filter((filename: string) => filename.endsWith(".md"))
    .map((filename: string) => ({
      content: fs.readFileSync(path.join(dataDir, filename), "utf8"),
      filename,
    }))
    .map(({ filename, content }) => ({
      ...fm<{ title: string }>(content),
      slug: filename.replace(".md", ""),
      published: DateTime.fromISO(
        filename.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
        { zone: "utc" },
      ),
    }))
    .filter((post) => today.isAfter(post.published.toJSDate()))
    .sort((a, b) => b.published.toMillis() - a.published.toMillis());
  return { posts };
}

export default function Home() {
  const howItWorksId = useId();
  const { posts } = useLoaderData<typeof loader>();
  return (
    <>
      <main className="mb-20 flex min-h-screen flex-col gap-y-20">
        <HeroSection howItWorksId={howItWorksId} />
        <section className="prose prose-lg md:min-w-4xl md:mx-auto flex flex-col gap-y-10 mx-2">
          <JoinWaitlist />
          <FeaturesSection />
          <HowItWorksSection howItWorksId={howItWorksId} />
          <BlogPosts posts={posts} />
          <SpecialtyLeasing />
        </section>
      </main>
      <Footer />
    </>
  );
}
