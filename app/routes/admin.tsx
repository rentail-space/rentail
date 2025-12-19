import { type LoaderFunctionArgs, useOutlet } from "react-router";
import { verifyAdmin } from "~/lib/sessions.server";
import NotFoundPage from "./$";

export const handle = {
  headerLinks: [
    { label: "All centers", to: "/admin/centers" },
    { label: "All users", to: "/admin/users" },
  ],
};

export async function loader({ request }: LoaderFunctionArgs) {
  return await verifyAdmin(request.headers);
}

export default function Admin() {
  const outlet = useOutlet();
  return (
    <main className="container mx-auto my-10 p-5">
      <title>Admin - Specialty Leasing & Retail Spaces | Rentail.space</title>
      <meta
        name="description"
        content="Manage your account information and settings."
      />
      <meta name="keywords" content="admin, retail spaces, rentail.space" />

      {outlet ?? <NotFoundPage />}
    </main>
  );
}
