import type { Route } from "+types/app/+types/root";
import type { JsonValue } from "@prisma/client/runtime/client";
import debug from "debug";
import { createCookieSessionStorage } from "react-router";
import { z } from "zod";
import envVars from "~/lib/env";

const utmSchema = z.object({
  source: z.string().optional(),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  term: z.string().optional(),
  content: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  referer: z.string().optional(),
});

type FirstRequest = z.infer<typeof utmSchema>;

/**
 * Safely parse a JSON-encoded UTM string from the database.
 * Returns the parsed UTM object or undefined if parsing fails.
 */
export function safeParseUtm(
  utm: string | JsonValue,
): FirstRequest | undefined {
  if (!utm) return undefined;
  try {
    const parsed = utmSchema.safeParse(
      utm instanceof Object ? utm : JSON.parse(utm.toString()),
    );
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

const logger = debug("server:middleware:utm");

const { getSession, commitSession } = createCookieSessionStorage<
  FirstRequest,
  undefined
>({
  // a Cookie from `createCookie` or the CookieOptions to create one
  cookie: {
    name: "__utm",
    domain: envVars.isProduction ? "rentail.space" : "localhost",
    httpOnly: true,
    maxAge: 1 * 24 * 60 * 60, // 1 day
    path: "/",
    sameSite: "lax",
    secrets: [envVars.SESSION_SECRET],
    secure: envVars.isProduction,
  },
});

/**
 * Middleware to capture UTM parameters from the URL and store them in the
 * session on the first request. Also capture the IP address, user agent, and
 * referrer from the first request.
 */
export const utmMiddleware: Route.MiddlewareFunction = async (
  { request },
  next,
) => {
  const session = await getSession(request.headers.get("cookie"));
  if (session.has("ip") || session.has("referer")) return next();

  const searchParams = new URL(request.url).searchParams;
  for (const name of ["source", "medium", "campaign", "term", "content"]) {
    if (searchParams.has(`utm_${name}`)) {
      session.set(
        name as keyof FirstRequest,
        searchParams.get(`utm_${name}`) ?? undefined,
      );
    }
  }
  session.set("ip", request.headers.get("x-real-ip") ?? undefined);
  session.set("userAgent", request.headers.get("user-agent") ?? undefined);
  session.set("referer", request.headers.get("referer") ?? undefined);

  logger("utmMiddleware", session.data);
  const sessionCookie = await commitSession(session);
  const response = await next();
  response.headers.append("set-cookie", sessionCookie);
  return response;
};

/**
 * Save UTM parameters from the first request to the server and store them in
 * the session.  Also capture the IP address, user agent, and referrer from the
 * first request.
 */
export async function saveUtmParams(request: Request): Promise<{
  responseHeaders: Headers;
}> {
  const session = await getSession(request.headers.get("cookie"));
  if (session.has("ip") || session.has("referer"))
    return { responseHeaders: new Headers() };

  const searchParams = new URL(request.url).searchParams;
  for (const name of ["source", "medium", "campaign", "term", "content"]) {
    if (searchParams.has(`utm_${name}`)) {
      session.set(
        name as keyof FirstRequest,
        searchParams.get(`utm_${name}`) ?? undefined,
      );
    }
  }

  session.set("ip", request.headers.get("x-real-ip") ?? undefined);
  session.set("userAgent", request.headers.get("user-agent") ?? undefined);
  session.set("referer", request.headers.get("referer") ?? undefined);

  logger("Saving UTM parameters to session", session.data);
  const sessionCookie = await commitSession(session);
  const headers = new Headers({ "set-cookie": sessionCookie });
  return { responseHeaders: headers };
}

/**
 * Read UTM parameters from the session. Also include the IP address, user
 * agent, and referrer from the first request.
 */
export async function readUtmParams(
  requestHeaders: Headers,
): Promise<FirstRequest> {
  const session = await getSession(requestHeaders.get("cookie"));
  return session.data ?? {};
}
