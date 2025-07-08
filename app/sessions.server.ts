import env from "env-var";
import { createCookieSessionStorage } from "react-router";

type SessionData = {
  userId: string;
  interactions: number;
};

type SessionFlashData = {
  error: string;
};

const sessionSecret = env.get("SESSION_SECRET").required().asString();

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      sameSite: "lax",
      secrets: [sessionSecret],
      secure: process.env.NODE_ENV === "production",
    },
  });

export { getSession, commitSession, destroySession };
