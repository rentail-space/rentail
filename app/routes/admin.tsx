import { type LoaderFunctionArgs, useLocation, useOutlet } from "react-router";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { Card, CardContent } from "~/components/ui/Card";
import { verifyAdmin } from "~/lib/sessions.server";

export const handle = {
  headerLinks: [
    {
      label: "All users",
      to: "/admin/users",
      description: "Show all users that have visited the website.",
    },
    {
      label: "SEO Ranking",
      to: "/admin/seo-rank",
      description: "Show the SEO ranking of the website and how it is ranked.",
    },
    {
      label: "Visibility",
      to: "/admin/visibility",
      description: "Show the visibility of the website and how it is ranked.",
    },
  ],

  secondaryLinks: [
    {
      label: "Searches",
      to: "/admin/searches",
      description: "Show all searches that have been made on the website.",
    },
    {
      label: "Bots",
      to: "/admin/bots",
      description: "Show all bots that have visited the website.",
    },
    {
      label: "Ranked Centers",
      to: "/admin/ranked-centers",
      description:
        "Show all centers that are ranked by our algorithm and how we rank them.",
    },
    {
      label: "Landing Pages",
      to: "/admin/entrances",
      description:
        "Show metrics for all landing pages (entrances) of the website.",
    },
    {
      label: "All centers",
      to: "/admin/centers",
      description: "Show all centers we have in our database.",
    },
    {
      label: "API Usage",
      to: "/admin/api-usage",
      description: "Show current and historical API usage and projected costs.",
    },
  ],
};

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);
  return "OK";
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
