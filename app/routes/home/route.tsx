import BlogPostsGrid from "~/components/ui/BlogPostsGrid";
import { recentBlogPosts } from "~/lib/blogPosts.server";
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
      <title>
        Rentail.space - Specialty Leasing & Short-Term Retail Spaces in Shopping
        Centers
      </title>
      <meta
        name="description"
        content="Find short-term retail spaces in shopping centers. Kiosks, pop-ups, and RMUs nationwide. Built for small businesses—AI-powered matching, transparent pricing, no broker fees."
      />
      <meta
        name="keywords"
        content="specialty leasing, kiosk rental, pop-up shop, mall cart, temporary retail space, short-term lease, shopping center, seasonal retail, retail kiosk, mall kiosk rental, cart space rental"
      />
      <meta
        property="og:title"
        content="Rentail.space - Specialty Leasing & Short-Term Retail Spaces"
      />
      <meta
        property="og:description"
        content="Find short-term retail spaces in shopping centers. Kiosks, pop-ups, and RMUs nationwide. Built for small businesses—AI-powered matching, transparent pricing, no broker fees."
      />
      <meta
        property="og:image"
        content="https://rentail.space/images/og-image.png"
      />
      <meta property="og:url" content="https://rentail.space" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Rentail.space" />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="Rentail.space - Specialty Leasing & Short-Term Retail Spaces"
      />
      <meta
        name="twitter:description"
        content="Find short-term retail spaces in shopping centers. Kiosks, pop-ups, and RMUs nationwide. Built for small businesses—AI-powered matching, transparent pricing, no broker fees."
      />
      <meta
        name="twitter:image"
        content="https://rentail.space/images/og-image.png"
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
