import { type LoaderFunctionArgs, useLocation, useOutlet } from "react-router";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { Card, CardContent } from "~/components/ui/Card";
import LoadingImage from "~/components/ui/LoadingImage";
import PageLoadingBouncer from "~/components/ui/PageLoadingBouncer";
import { verifyAdmin } from "~/lib/sessions.server";

export const handle = {
  headerLinks: [],

  dropdownLinks: [
    {
      label: "All users",
      to: "/admin/users",
      description:
        "Registered and anonymous users who have interacted with rentail.space.",
    },
    {
      label: "SEO Ranking",
      to: "/admin/seo-rank",
      description: "Search engine performance across target keywords.",
    },
    {
      label: "Recent Visibility Checks",
      to: "/admin/visibility",
      description:
        "How AI search engines  and traditional search discover and cite rentail.space.",
    },
    {
      label: "Search Console Analytics",
      to: "/admin/searches",
      description:
        "Analytics dashboard showing all user search queries within rentail.space.",
    },
    {
      label: "Bot Traffic",
      to: "/admin/bots",
      description:
        "Automated traffic from search engine crawlers, AI agents, monitoring services, and other bots.",
    },
    {
      label: "Shopping Center Ranking",
      to: "/admin/ranked-centers",
      description:
        "All shopping centers evaluated by rentail's proprietary ranking algorithm.",
    },
    {
      label: "Landing Pages (Entrances)",
      to: "/admin/entrances",
      description:
        "Performance metrics for all entry points (entrances) to rentail.space.",
    },
    {
      label: "All centers",
      to: "/admin/centers",
      description:
        "Complete database of shopping centers collected from Google Places API.",
    },
    {
      label: "API Usage",
      to: "/admin/api-usage",
      description: "Consumption and costs across external APIs.",
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
      <PageLoadingBouncer />
      {isRoot ? <AdminLinks /> : outlet}
    </main>
  );
}

function AdminLinks() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {[...handle.headerLinks, ...handle.dropdownLinks].map((link) => (
        <Card key={link.to} className="bg-secondary-background text-foreground">
          <CardContent>
            <ActiveLink to={link.to} className="flex flex-col gap-2">
              <h3 className="font-bold text-lg">{link.label}</h3>
              <LoadingImage
                src={`/images/${link.to}.png`}
                alt={link.label}
                figureClassName="border-b-2 border-black"
                maxHeight={200}
              />
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
