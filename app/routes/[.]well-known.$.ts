import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Route } from "../+types/root";

export async function loader({ params }: Route.LoaderArgs) {
  const path = resolve("./app/data/.well-known", params["*"] ?? "");
  const filename = `${path}.json`;

  if (!existsSync(filename)) throw new Response("Not Found", { status: 404 });
  const file = await readFile(filename, "utf-8");
  console.log(file);
  return new Response(file, {
    headers: { "Content-Type": "application/json" },
  });
}
