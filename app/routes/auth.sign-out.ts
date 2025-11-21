import { redirect } from "react-router";
import { signOut } from "~/sessions.server";
import type { Route } from "./+types/auth.sign-out";

export async function loader({ request }: Route.ActionArgs) {
  await signOut(request.headers);
  throw redirect("/");
}
