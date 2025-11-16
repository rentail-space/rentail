import { Link, Outlet, useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";
import NotFoundPage from "./$";

export default function Admin() {
  const root = useRouteLoaderData<typeof rootLoader>("root");
  if (!root?.isAdmin) return <NotFoundPage />;

  return (
    <div>
      <div className="mx-auto flex max-w-md flex-row items-center">
        <ul className="menu menu-horizontal mx-auto">
          <li>
            <Link to="/admin/centers">All centers</Link>
          </li>
        </ul>
        <span className="badge">Signed in as {root.user?.email}</span>
      </div>

      <Outlet />
    </div>
  );
}
