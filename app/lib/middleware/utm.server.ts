import type { Route } from "+types/app/+types/root";
import debug from "debug";
import { type Session, createCookieSessionStorage } from "react-router";
import { isCrawler } from "~/lib/crawler.server";
import envVars from "~/lib/env";
import { type FirstRequest, safeParseUtm } from "~/lib/utm";

export { safeParseUtm };

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
 * The session first-touch parameters should be captured into, or null when
 * there is nothing to capture: crawlers are skipped (they never convert, and
 * the cookie would make every one of their responses uncacheable), as is a
 * visitor whose first request was already captured.
 *
 * `entry.server` asks the same question before letting the CDN cache a
 * response - the middleware appends this cookie *after* that response is built,
 * so the only way to know it is coming is to ask.
 *
 * @param request - The request object
 * @returns The session to capture into, or null
 */
export async function utmCaptureSession(
  request: Request,
): Promise<Session<FirstRequest, undefined> | null> {
  if (isCrawler(request.headers.get("user-agent") ?? "")) return null;

  const session = await getSession(request.headers.get("cookie"));
  // `ip` is only captured when the proxy sends `x-real-ip`; `userAgent` is the
  // reliable marker that this visitor has already been captured.
  return session.has("userAgent") ? null : session;
}

/**
 * Middleware to capture UTM parameters from the URL and store them in the
 * session on the first request. Also capture the IP address, user agent, and
 * referrer from the first request.
 */
export const utmMiddleware: Route.MiddlewareFunction = async (
  { request },
  next,
) => {
  const session = await utmCaptureSession(request);
  if (!session) return next();

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
 * Read UTM parameters from the session. Also include the IP address, user
 * agent, and referrer from the first request.
 */
export async function readUtmParams(
  requestHeaders: Headers,
): Promise<FirstRequest> {
  const session = await getSession(requestHeaders.get("cookie"));
  return session.data ?? {};
}
