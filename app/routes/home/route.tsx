import BlogPostsGrid from "~/components/ui/BlogPostsGrid";
import { recentBlogPosts } from "~/lib/blogPosts.server";
import pageMeta from "~/lib/pageMeta";
import type { Route } from "./+types/route";

export function meta(): Route.MetaDescriptors {
  return pageMeta({
    title:
      "Rentail.space - Specialty Leasing & Short-Term Retail Spaces in Shopping Centers",
    description:
      "Find short-term retail spaces in shopping centers. Kiosks, pop-ups, and RMUs nationwide. Built for small businesses—AI-powered matching, transparent pricing, no broker fees.",
    url: "/",
    keywords:
      "specialty leasing, kiosk rental, pop-up shop, mall cart, temporary retail space, short-term lease, shopping center, seasonal retail, retail kiosk, mall kiosk rental, cart space rental",
  });
}
import ActivityCounter from "~/routes/home/ActivityCounter";
import FeaturesSection from "~/routes/home/FeaturesSection";
import HeroSection from "~/routes/home/HeroSection";
import SpecialtyLeasing from "~/routes/home/SpecialtyLeasing";

export const handle = { headerLinks: [] };

export async function loader() {
  const posts = await recentBlogPosts();
  return { posts };
}

export default function Home({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <main
      className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]"
      aria-label="Home page"
    >
      <HeroSection />
      <FeaturesSection />
      <SpecialtyLeasing />
      <BlogPostsGrid
        className="bg-[hsl(60,100%,99%)]"
        posts={loaderData.posts}
        limit={6}
      />
      <HubSpotScript />
      <ActivityCounter />
    </main>
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
