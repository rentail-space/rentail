import type { LoaderFunctionArgs } from "react-router";
import { findSessionUser } from "~/lib/sessions.server";

/**
 * The signed-in user for the client. Documents carry no user state (so they
 * stay identical for every visitor and cacheable at the CDN), and the browser
 * calls this when its session marker cookie is set.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await findSessionUser(request.headers);
  return Response.json({ user }, { headers: { "Cache-Control": "no-store" } });
}
