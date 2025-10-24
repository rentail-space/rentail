import fs from "node:fs";
import fm from "front-matter";
import { useId } from "react";
import Footer from "~/components/layout/Footer";
import { recentBlogPosts } from "~/lib/blogPosts.server";
import BlogPosts from "~/routes/home/BlogPosts";
import FeaturesSection from "~/routes/home/FeaturesSection";
import HeroSection from "~/routes/home/HeroSection";
import HowItWorksSection from "~/routes/home/HowItWorksSection";
import JoinWaitlist from "~/routes/home/JoinWaitlist";
import SpecialtyLeasing from "~/routes/home/SpecialtyLeasing";

export const handle = { hideLayout: true };

export async function loader() {
  const recent = await recentBlogPosts();
  const posts = recent
    .map((post) => ({
      content: fs.readFileSync(post.filename, "utf8"),
      ...post,
    }))
    .map(({ content, ...post }) => ({
      ...fm<{ title: string; alt?: string }>(content),
      ...post,
    }));
  return { posts };
}

export default function Home({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const howItWorksId = useId();
  return (
    <>
      <main className="mb-20 flex min-h-screen flex-col gap-y-20">
        <HeroSection howItWorksId={howItWorksId} />
        <section className="prose prose-lg mx-2 flex flex-col gap-y-10 md:mx-auto md:min-w-4xl">
          <JoinWaitlist />
          <FeaturesSection />
          <HowItWorksSection howItWorksId={howItWorksId} />
          <BlogPosts posts={loaderData.posts} />
          <SpecialtyLeasing />
        </section>
      </main>
      <Footer />
      <HubSpotScript />
    </>
  );
}

function HubSpotScript() {
  return (
    <script
      async
      defer
      id="hs-script-loader"
      src="//js-eu1.hs-scripts.com/146512099.js"
      type="text/javascript"
    />
  );
}
