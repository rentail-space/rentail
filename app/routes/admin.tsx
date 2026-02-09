import { type LoaderFunctionArgs, useLocation, useOutlet } from "react-router";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { Card, CardContent } from "~/components/ui/Card";
import { verifyAdmin } from "~/lib/sessions.server";

export const handle = {
  headerLinks: [
    {
      label: "All users",
      to: "/admin/users",
      description:
        "Comprehensive view of all registered and anonymous users who have interacted with rentail.space. Includes authentication status, session data, working memory state, UTM tracking parameters, geographic location, and user agent information for analytics and support purposes.",
    },
    {
      label: "SEO Ranking",
      to: "/admin/seo-rank",
      description:
        "Track rentail.space's search engine performance across target keywords and geographic markets. Monitor organic search positions, visibility trends, and competitive rankings to optimize content strategy and improve discoverability for specialty lease seekers.",
    },
    {
      label: "Visibility",
      to: "/admin/visibility",
      description:
        "Monitor how AI search engines (ChatGPT, Perplexity, Gemini, Claude) and traditional search (Google, Bing) discover and cite rentail.space. Track visibility checks, citation patterns, and generative engine optimization effectiveness to maximize AI-powered referral traffic.",
    },
  ],

  secondaryLinks: [
    {
      label: "Searches",
      to: "/admin/searches",
      description:
        "Analytics dashboard showing all user search queries within rentail.space, including geographic searches for shopping centers, specialty lease opportunities, and conversational AI interactions. Reveals user intent patterns, popular locations, and unmet needs to guide product development.",
    },
    {
      label: "Bots",
      to: "/admin/bots",
      description:
        "Monitor automated traffic from search engine crawlers, AI agents, monitoring services, and other bots. Track request patterns, user agent strings, accepted formats (HTML, JSON, etc.), and bot behavior to optimize crawlability and detect potential abuse.",
    },
    {
      label: "Ranked Centers",
      to: "/admin/ranked-centers",
      description:
        "View all shopping centers evaluated by rentail's proprietary ranking algorithm. Shows tier classifications, ranking scores, demographic factors, space availability, and quality metrics that determine which properties appear in search results and recommendations.",
    },
    {
      label: "Landing Pages",
      to: "/admin/entrances",
      description:
        "Performance metrics for all entry points (entrances) to rentail.space, including organic search, paid ads, social media, and direct traffic. Track bounce rates, session depth, conversion paths, and UTM attribution to optimize acquisition channels and user onboarding.",
    },
    {
      label: "All centers",
      to: "/admin/centers",
      description:
        "Complete database of shopping centers collected from Google Places API, enriched with AI-extracted details, website scraping, and manual curation. Includes property metadata, geographic coordinates, space inventory, ownership information, and enrichment status for data quality audits.",
    },
    {
      label: "API Usage",
      to: "/admin/api-usage",
      description:
        "Monitor consumption and costs across external APIs including Anthropic Claude, Google Places, Google Geocoding, SerpAPI, and Resend. Track usage patterns, rate limits, projected monthly spend, and cost anomalies to manage infrastructure budget and prevent overages.",
    },
  ],
};

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);
  return "OK";
}

export function headers() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

export default function Admin() {
  const outlet = useOutlet();
  const location = useLocation();
  const isRoot = location.pathname === "/admin";

  return (
    <main className="container mx-auto my-10 p-5">
      <title>Admin | Rentail.space</title>
      {isRoot ? <AdminLinks /> : outlet}
    </main>
  );
}

function AdminLinks() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {[...handle.headerLinks, ...handle.secondaryLinks].map((link) => (
        <Card key={link.to} className="bg-secondary-background text-foreground">
          <CardContent>
            <ActiveLink to={link.to} className="flex flex-col gap-2">
              <h3 className="font-bold text-lg">{link.label}</h3>
              <p className="whitespace-break-spaces text-gray-500">
                {link.description}
              </p>
            </ActiveLink>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
