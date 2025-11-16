import { Outlet, useRouteLoaderData } from "react-router";
import PageHeader from "~/components/layout/PageHeader";
import type { loader as rootLoader } from "~/root";
import NotFoundPage from "./$";

export const handle = { hideLayout: true };

const adminLinks = [
  {
    to: "/admin/centers",
    label: "All centers",
  },
];

export default function Admin() {
  const root = useRouteLoaderData<typeof rootLoader>("root");
  if (!root?.isAdmin) return <NotFoundPage />;

  return (
    <div>
      <PageHeader links={adminLinks} />
      <Outlet />
    </div>
  );
}
