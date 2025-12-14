import { type LoaderFunctionArgs, useOutlet } from "react-router";
import { verifyAdmin } from "~/lib/sessions.server";
import NotFoundPage from "./$";

export const handle = {
  headerLinks: [
    { label: "States", to: "/states" },
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
    <main className="container mx-auto my-10">
      {outlet ?? <NotFoundPage />}
    </main>
  );
}
