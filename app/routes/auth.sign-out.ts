import { redirect } from "react-router";
import { signOut } from "~/lib/sessions.server";
import type { Route } from "./+types/auth.sign-out";

export async function loader({ request }: Route.ActionArgs) {
  const headers = await signOut(request.headers);
  throw redirect("/", { headers });
}
