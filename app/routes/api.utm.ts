import type { Route } from "./+types/api.utm";
import {
  captureFirstTouch,
  commitSession,
  utmCaptureSession,
} from "~/lib/middleware/utm.server";
import { z } from "zod";

const captureBody = z.object({
  url: z.string(),
  referrer: z.string().optional(),
});

/** GET requests hit the loader first; only POST is supported. */
export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}

/**
 * First-touch attribution moved client-side: the browser posts the landing
 * URL once per session, so no document response carries the `__utm` capture
 * cookie and every content page stays CDN-cacheable.
 */
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: z.infer<typeof captureBody>;
  try {
    const parsed = captureBody.safeParse(await request.json());
    if (!parsed.success) {
      return new Response("Bad Request", { status: 400 });
    }
    body = parsed.data;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const session = await utmCaptureSession(request);
  if (!session) return new Response(null, { status: 204 });

  let url: URL;
  try {
    url = new URL(body.url);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  await captureFirstTouch(
    session,
    url.searchParams,
    request.headers.get("x-real-ip"),
    request.headers.get("user-agent"),
    body.referrer ?? null,
  );

  return new Response(null, {
    status: 204,
    headers: {
      "set-cookie": await commitSession(session),
      "cache-control": "no-store",
    },
  });
}
