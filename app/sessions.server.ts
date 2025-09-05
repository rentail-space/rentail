import { createCookieSessionStorage, type Session } from "react-router";
import serverConfig from "./lib/config";

type SessionData = {
  user_id?: string;
  conversation_id?: string;
};

type SessionFlashData = {
  error: string;
};

export type SessionType = Session<SessionData, SessionFlashData>;

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      httpOnly: true,
      isSigned: true,
      maxAge: serverConfig.SESSION_MAX_AGE_SECONDS,
      name: "__session",
      path: "/",
      sameSite: "lax",
      secrets: [serverConfig.SESSION_SECRET],
      secure: serverConfig.isProduction,
    },
  });

export { getSession, commitSession, destroySession };
