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

export { commitSession };

/**
 * The session first-touch parameters should be captured into, or null when
 * there is nothing to capture: crawlers are skipped (they never convert, and
 * the cookie would make every one of their responses uncacheable), as is a
 * visitor whose first request was already captured.
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
 * Capture UTM parameters from the URL and store them in the session, along
 * with the IP address, user agent, and referrer. Called from the
 * `POST /api/utm` action, which the browser hits on first page load.
 */
export async function captureFirstTouch(
  session: Session<FirstRequest, undefined>,
  searchParams: URLSearchParams,
  ip: string | null,
  userAgent: string | null,
  referer: string | null,
): Promise<void> {
  for (const name of ["source", "medium", "campaign", "term", "content"]) {
    if (searchParams.has(`utm_${name}`)) {
      session.set(
        name as keyof FirstRequest,
        searchParams.get(`utm_${name}`) ?? undefined,
      );
    }
  }
  session.set("ip", ip ?? undefined);
  session.set("userAgent", userAgent ?? undefined);
  session.set("referer", referer ?? undefined);

  logger("captureFirstTouch", session.data);
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
