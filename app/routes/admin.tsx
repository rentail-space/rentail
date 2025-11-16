import { Link, Outlet } from "react-router";
import { findUserAndLastChat } from "~/sessions.server";
import NotFoundPage from "./$";
import type { Route } from "./+types/admin";

export async function loader({ request }: Route.LoaderArgs) {
  const found = await findUserAndLastChat(request.headers);
  if (found?.user.email !== "assaf@labnotes.org")
    throw new Response(null, { status: 403 });
  return { user: found?.user };
}

export function ErrorBoundary() {
  return <NotFoundPage />;
}

export default function Admin({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <div className="mx-auto flex max-w-md flex-row items-center">
        <ul className="menu menu-horizontal mx-auto">
          <li>
            <Link to="/admin/centers">All centers</Link>
          </li>
        </ul>
        <span className="badge">Signed in as {loaderData.user?.email}</span>
      </div>

      <Outlet />
    </div>
  );
}
