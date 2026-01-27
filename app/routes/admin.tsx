import { type LoaderFunctionArgs, redirect, useOutlet } from "react-router";
import { verifyAdmin } from "~/lib/sessions.server";

export const handle = {
  headerLinks: [
    { label: "All centers", to: "/admin/centers" },
    { label: "All users", to: "/admin/users" },
    { label: "Ranking", to: "/admin/ranking" },
    { label: "Visibility", to: "/admin/visibility" },
    { label: "Searches", to: "/admin/searches" },
    { label: "Bots", to: "/admin/bots" },
  ],
};

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);
  const { pathname } = new URL(request.url);
  return pathname === "/admin" ? redirect("/admin/users") : null;
}

export default function Admin() {
  const outlet = useOutlet();
  return (
    <main className="container mx-auto my-10 p-5">
      <title>Admin | Rentail.space</title>
      <meta
        name="description"
        content="Manage your account information and settings."
      />
      <meta name="keywords" content="admin, retail spaces, rentail.space" />

      {outlet}
    </main>
  );
}
