import { redirect } from "react-router";
import { signOut } from "~/sessions.server";
import type { Route } from "./+types/auth.signout";

export async function action({ request }: Route.ActionArgs) {
  await signOut(request.headers);
  return redirect("/");
}
