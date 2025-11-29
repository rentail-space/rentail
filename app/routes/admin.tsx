import {
  type LoaderFunctionArgs,
  useOutlet,
  useRouteLoaderData,
} from "react-router";
import PageLayout from "~/components/layout/PageLayout";
import type { loader as rootLoader } from "~/root";
import { verifyAdmin } from "~/sessions.server";
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
  const root = useRouteLoaderData<typeof rootLoader>("root");
  const outlet = useOutlet();
  return root?.isAdmin ? (
    <main className="container mx-auto my-10">
      {outlet ?? <NotFoundPage />}
    </main>
  ) : (
    <PageLayout>
      <NotFoundPage />
    </PageLayout>
  );
}
