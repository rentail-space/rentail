import BlogPostsGrid from "~/components/ui/BlogPostsGrid";
import { recentBlogPosts } from "~/lib/blogPosts.server";
import FeaturesSection from "~/routes/home/FeaturesSection";
import HeroSection from "~/routes/home/HeroSection";
import SpecialtyLeasing from "~/routes/home/SpecialtyLeasing";
import CTASection from "./WaitlistSection";

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
    <main className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]">
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <BlogPostsGrid
        className="bg-[hsl(60,100%,99%)]"
        posts={loaderData.posts}
      />
      <SpecialtyLeasing />
      <HubSpotScript />
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
