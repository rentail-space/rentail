import BlogPostsGrid from "~/components/ui/BlogPostsGrid";
import { recentBlogPosts } from "~/lib/blogPosts.server";
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
      <title>
        Rentail.space - Specialty Leasing & Short-Term Retail Spaces in Shopping
        Centers
      </title>
      <meta
        name="description"
        content="The comprehensive marketplace for specialty leasing and short-term retail spaces in US shopping centers. Find kiosks, pop-up shops, carts, and temporary retail locations nationwide. Real-time availability, transparent pricing, AI-powered matching."
      />
      <meta
        name="keywords"
        content="specialty leasing, kiosk rental, pop-up shop, mall cart, temporary retail space, short-term lease, shopping center, seasonal retail, retail kiosk, mall kiosk rental, cart space rental"
      />
      <link rel="canonical" href="https://rentail.space" />

      <HeroSection />
      <FeaturesSection />
      <SpecialtyLeasing />
      <BlogPostsGrid
        className="bg-[hsl(60,100%,99%)]"
        posts={loaderData.posts}
        limit={6}
      />
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
