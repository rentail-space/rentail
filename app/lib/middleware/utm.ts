import debug from "debug";
import { createCookieSessionStorage } from "react-router";
import type { Route } from "../../+types/root";
import env from "../env";

type UTM = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

const logger = debug("middleware");

const { getSession, commitSession } = createCookieSessionStorage<
  UTM,
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
 * Middleware to capture UTM parameters from the URL and store them in the session
 * on the first request. UTM parameters are only stored if they don't already exist
 * in the session, ensuring we capture the original source of the user's visit.
 */
export const utmMiddleware: Route.MiddlewareFunction = async (
  { request },
  next,
) => {
  const searchParams = new URL(request.url).searchParams;
  const session = await getSession(request.headers.get("cookie"));
  let hasUtmParams = false;
  for (const name of ["source", "medium", "campaign", "term", "content"]) {
    if (searchParams.has(`utm_${name}`)) {
      session.set(
        name as keyof UTM,
        searchParams.get(`utm_${name}`) ?? undefined,
      );
      hasUtmParams = true;
    }
  }

  if (hasUtmParams) {
    logger("utmMiddleware", { session, hasUtmParams });
    const sessionCookie = await commitSession(session);
    const response = await next();
    response.headers.append("set-cookie", sessionCookie);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } else return next();
};

export async function readUtmParams(requestHeaders: Headers): Promise<UTM> {
  const session = await getSession(requestHeaders.get("cookie"));
  return session.data ?? {};
}
