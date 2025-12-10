import debug from "debug";
import { createCookieSessionStorage } from "react-router";
import env from "~/lib/env";
import type { Route } from "~/types/app/+types/root";

type FirstRequest = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
};

const logger = debug("middleware");

const { getSession, commitSession } = createCookieSessionStorage<
  FirstRequest,
  undefined
>({
  // a Cookie from `createCookie` or the CookieOptions to create one
  cookie: {
    name: "__utm",
    domain: env.isProduction ? "rentail.space" : "localhost",
    httpOnly: true,
    maxAge: 1 * 24 * 60 * 60, // 1 day
    path: "/",
    sameSite: "lax",
    secrets: [env.BETTER_AUTH_SECRET],
    secure: env.isProduction,
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
