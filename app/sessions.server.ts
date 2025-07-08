import { createCookieSessionStorage } from "react-router";
import serverConfig from "./lib/config";

type SessionData = {
  userId: string;
  interactions: number;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: serverConfig.SESSION_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secrets: [serverConfig.SESSION_SECRET],
      secure: serverConfig.isProduction,
    },
  });

export { getSession, commitSession, destroySession };
