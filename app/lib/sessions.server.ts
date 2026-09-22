import type { UIMessage } from "ai";
import type { UserGetPayload } from "prisma/generated/models";
import type { Chat, User } from "prisma/generated";
import { type Session, createCookieSessionStorage } from "react-router";
import { readUtmParams } from "~/lib/middleware/utm.server";
import { isCrawler } from "~/lib/crawler.server";
import type { SessionUser } from "~/lib/sessionUser";
import { geocodeFromHeaders } from "./geocode";
import { getDeviceInfo } from "~/lib/deviceDetection.server";
import { reverse } from "node:dns/promises";
import { ulid } from "ulid";
import sendNewUserNotification from "~/emails/NewUserNotification";
import sendWelcomeEmail from "~/emails/WelcomeEmail";
import invariant from "tiny-invariant";
import envVars from "~/lib/env";
import welcome from "~/prompts/welcome.md?raw";
import bcrypt from "bcryptjs";
import prisma from "~/lib/prisma.server";
import { safeTextParts } from "~/lib/aiMessage";
import debug from "debug";

type SessionData = {
  token: string;
};

type SessionFlashData = {
  error: string;
};

const adminEmails = ["assaf@labnotes.org"];

// Lifetime of the session cookie and its browser-readable marker.
const SESSION_MAX_AGE = 365 * 24 * 60 * 60;

// Cookie the browser can read (not HttpOnly), used by the client to decide
// whether to fetch the session. Documents are rendered without user state so
// that they stay identical for every visitor and cacheable at the CDN.
const USER_MARKER = "__user";

const logger = debug("server:sessions");

const cookieDomain = envVars.isProduction ? "rentail.space" : "localhost";

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: "__session",
      domain: cookieDomain,
      httpOnly: true,
      maxAge: SESSION_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secrets: [envVars.SESSION_SECRET],
      secure: envVars.isProduction,
    },
  });

/**
 * Serialize the session marker cookie. A `maxAge` of 0 clears it.
 *
 * @param maxAge - Lifetime in seconds
 * @returns The Set-Cookie value
 */
function userMarkerCookie(maxAge: number): string {
  return [
    maxAge > 0 ? `${USER_MARKER}=1` : `${USER_MARKER}=`,
    `Domain=${cookieDomain}`,
    `Max-Age=${maxAge}`,
    "Path=/",
    "SameSite=Lax",
    ...(envVars.isProduction ? ["Secure"] : []),
  ].join("; ");
}

/**
 * Get the most recent chat for the user from the session. If the user exists,
 * there must be a last chat for the user. Also return the recent messages in
 * the chat and the HTTP headers with the session cookie set.
 *
 * UTM capture is the middleware's job (`utmMiddleware`); this runs inside the
 * chat route, which is never cached.
 *
 * @param request - The request object
 * @returns The last chat, messages, response headers with the session cookie
 * set, user. If the user is not found, return empty response headers.
 */
export async function findUserAndLastChat(request: Request): Promise<
  | {
      chat: Chat;
      messages: UIMessage[];
      responseHeaders: Headers;
      user: User;
    }
  | { responseHeaders: Headers }
> {
  const session = await userFromCookie(request.headers);
  if (!("user" in session)) return { responseHeaders: new Headers() };

  const { user, responseHeaders } = session;
  const chat = await prisma.chat.findFirst({
    orderBy: { createdAt: "desc" },
    take: 1,
    where: { userId: user.id },
  });
  if (!chat) return { responseHeaders };

  const messages = await recentMessages(chat.id);
  return { chat, messages, responseHeaders, user };
}

/**
 * Get the chat with the given chat ID for the user from the session. If the
 * user exists, there must be a chat with the given chat ID, and it must belong
 * to that user. Also return the recent messages in the chat, the HTTP headers
 * with the session cookie set, and whether the user is an admin. If the user is
 * not found, or if the chat ID is mismatched, return undefined.
 *
 * @param chatId - The ID of the chat to find
 * @param requestHeaders - The request headers object
 * @returns The chat, messages, response headers with the session cookie set,
 * user.
 * @throws If the user is not found or the chat ID is mismatched
 */
export async function findUserAndChatById({
  chatId,
  requestHeaders,
}: {
  chatId: string;
  requestHeaders: Headers;
}): Promise<
  | {
      chat: Chat;
      messages: UIMessage[];
      responseHeaders: Headers;
      user: User;
    }
  | undefined
> {
  const session = await userFromCookie(requestHeaders);
  if (!("user" in session)) return;

  const { user } = session;
  const chat = await prisma.chat.findUnique({
    where: { id: chatId, user: { id: user.id } },
  });
  if (!chat) return;

  const messages = await recentMessages(chat.id);
  const responseHeaders = new Headers({
    "set-cookie": await commitSession(session.cookieSession),
  });
  return { chat, messages, responseHeaders, user };
}

/**
 * Find or create a user and chat. Also returns the HTTP headers which have the
 * session cookie set. If the user and chat are not found, create a new user and
 * chat.
 *
 * @param chatId - The ID of the chat to find or create
 * @param requestHeaders - The request headers object
 * @returns The chat, recent messages, user, and HTTP headers.
 */
export async function findOrCreateUser({
  chatId,
  requestHeaders,
}: {
  chatId: string;
  requestHeaders: Headers;
}): Promise<{
  chat: Chat;
  responseHeaders: Headers;
  messages: UIMessage[];
  user: User;
}> {
  const session = await userFromCookie(requestHeaders);
  // Look in session to see if we already have a user with that chat ID.
  if ("user" in session) {
    const { user } = session;
    const chat = await prisma.chat.findUniqueOrThrow({
      where: { id: chatId, user: { id: user.id } },
    });

    const messages = await recentMessages(chat.id);
    const responseHeaders = new Headers({
      "set-cookie": await commitSession(session.cookieSession),
    });
    return { chat, messages, responseHeaders, user };
  }

  const user = await createAnonymousUser({ chatId, requestHeaders });
  if (envVars.isProduction) await sendNewUserNotification(user);
  const chat = user.chats[0];
  const messages = await recentMessages(chat.id);

  const responseHeaders = await createSession({
    requestHeaders,
    userId: user.id,
  });
  return { chat, messages, user, responseHeaders };
}

/**
 * Get the 50 most recent messages for a chat.
 *
 * @param chatId - The chat ID to get the messages for
 * @returns The 50 most recent messages for the chat
 */
export async function recentMessages(chatId: string): Promise<UIMessage[]> {
  const recent = await prisma.messages.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    where: { chatId },
  });
  return (
    recent
      // NOTE: skip empty messages, API doesn't support empty messages
      .filter((message) =>
        safeTextParts(message.content).some((part) => part.text.trim() !== ""),
      )
      .reverse()
      // NOTE: ensure correct transformation to ModelMessage[]
      .map((message) => ({
        id: message.id,
        parts: safeTextParts(message.content),
        role: message.role,
      }))
  );
}

/**
 * Check if an IP address is from Google's domains by performing reverse DNS lookup.
 * This helps verify if a request is actually from Google's crawlers. If the reverse
 * DNS lookup fails, assume it's not a Google IP.
 *
 * @param ip - The IP address to check
 * @returns True if the IP is from Google's domains, false otherwise
 */
async function isBotByIP(ip?: string): Promise<boolean> {
  if (!ip) return false;
  try {
    // Skip reverse DNS check for localhost/private IPs
    if (
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.")
    )
      return false;

    const hostnames = await reverse(ip);
    const hostname = hostnames[0]?.toLowerCase() || "";

    // Check if the hostname ends with Google's known domains
    return (
      hostname.endsWith(".googlebot.com") || hostname.endsWith(".google.com")
    );
  } catch {
    // If reverse DNS lookup fails, assume it's not a Google IP
    logger("Reverse DNS lookup failed for IP: %s", ip);
    return false;
  }
}

/**
 * Verify that the user is an admin and return the user.
 *
 * @param requestHeaders - The request headers object
 * @returns The user if the user is an admin, or throws an error if the user is not an admin.
 */
export async function verifyAdmin(requestHeaders: Headers): Promise<User> {
  const session = await userFromCookie(requestHeaders);
  if (!("user" in session && session.user.isAdmin))
    throw new Response("Not found", { status: 404 });
  return session.user;
}

/**
 * Get the user from the cookie. Aftewards we will get the user's chat (the most
 * recent chat, or by ID).
 *
 * @param requestHeaders - The request headers object
 * @returns The cookie session, user, and response headers if found, or the
 * cookie session if not found.
 */
async function userFromCookie(requestHeaders: Headers): Promise<
  | {
      cookieSession: Session<SessionData, SessionFlashData>;
      user: User;
      responseHeaders: Headers;
    }
  | { cookieSession: Session<SessionData, SessionFlashData> }
> {
  const cookieSession = await getSession(requestHeaders.get("cookie"));
  if (!cookieSession.data.token) return { cookieSession };

  const session = await prisma.session.findFirst({
    include: { user: true },
    where: { token: cookieSession.data.token, expiresAt: { gt: new Date() } },
  });
  const user = session?.user;
  if (!user) return { cookieSession };

  // Refresh the session cookie, and (re)set the marker so sessions created
  // before the marker existed heal on their next request.
  const responseHeaders = new Headers();
  responseHeaders.append("set-cookie", await commitSession(cookieSession));
  responseHeaders.append("set-cookie", userMarkerCookie(SESSION_MAX_AGE));
  return { cookieSession, user, responseHeaders };
}

/**
 * Look up the signed-in user for the client, without loading chats or
 * messages. Returns `null` when nobody is signed in.
 *
 * @param requestHeaders - The request headers object
 * @returns The signed-in user, or null
 */
export async function findSessionUser(
  requestHeaders: Headers,
): Promise<SessionUser | null> {
  const session = await userFromCookie(requestHeaders);
  if (!("user" in session)) return null;

  const { id, name, email, isAdmin, isAnonymous } = session.user;
  return { id, name, email, isAdmin, isAnonymous };
}

/**
 * Sign in a user with their email and password.
 *
 * @param email - The email of the user
 * @param password - The password of the user
 * @param requestHeaders - The request headers object
 * @returns The HTTP headers with the session cookie set
 * @throws If the email and password do not match
 */
export async function signInEmail({
  email,
  password,
  requestHeaders,
}: {
  email: string;
  password: string;
  requestHeaders: Headers;
}): Promise<Headers> {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    invariant(user?.passwordHash, "User has no password hash");
    const valid = await bcrypt.compare(password, user.passwordHash);
    invariant(valid, "Password does not match");

    return await createSession({ requestHeaders, userId: user.id });
  } catch (error) {
    console.error(
      "signInEmail: %s",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new Error("Email and password do not match");
  }
}

/**
 * Sign up a user with their email and password.
 *
 * @param email - The email of the user
 * @param password - The password of the user
 * @param name - The name of the user
 * @param requestHeaders - The request headers object
 * @returns The HTTP headers with the session cookie set
 * @throws If the email and password do not match
 */
export async function signUpEmail({
  email,
  name,
  password,
  requestHeaders,
}: {
  email: string;
  name: string;
  password: string;
  requestHeaders: Headers;
}): Promise<Headers> {
  // Is this email already in use? If so, sign in the user.
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser)
    return await signInEmail({ email, password, requestHeaders });

  const session = await getSession(requestHeaders.get("Cookie"));
  const passwordHash = await bcrypt.hash(password, 10);

  // Is this session from an anonymous user? If so, convert them to a named user.
  const anonymousUser = await prisma.user.findFirst({
    where: {
      isAnonymous: true,
      sessions: {
        some: {
          expiresAt: { gt: new Date() },
          token: session.data.token,
        },
      },
    },
  });
  if (anonymousUser) {
    const updatedUser = await prisma.user.update({
      data: {
        isAdmin: adminEmails.includes(email),
        isAnonymous: false,
        name,
        email,
        passwordHash,
      },
      where: { id: anonymousUser.id },
    });
    await sendWelcomeEmail(updatedUser);
    if (envVars.isProduction) await sendNewUserNotification(updatedUser);
    return await createSession({ requestHeaders, userId: updatedUser.id });
  }

  // Create a new user account and return the session cookie.
  const newUser = await createAuthenticatedUser({
    chatId: ulid(),
    email,
    name,
    passwordHash,
    requestHeaders,
  });
  await sendWelcomeEmail(newUser);
  if (envVars.isProduction) await sendNewUserNotification(newUser);
  return await createSession({ requestHeaders, userId: newUser.id });
}

export async function signOut(requestHeaders: Headers): Promise<Headers> {
  const session = await getSession(requestHeaders.get("Cookie"));
  const token = session.data.token;
  // deleteMany rather than delete: signing out without a live session must
  // still clear the cookies instead of throwing.
  if (token) await prisma.session.deleteMany({ where: { token } });
  const headers = new Headers();
  headers.append("set-cookie", await destroySession(session));
  headers.append("set-cookie", userMarkerCookie(0));
  return headers;
}

/**
 * Create a new user account with a new chat and welcome message. The user may
 * be anonymous (no password hash) or authenticated (with a password hash).
 *
 * @param chatId - The ID of the chat to create
 * @param email - The email of the user (required for authenticated users)
 * @param isAnonymous - Whether the user is anonymous (required for anonymous users)
 * @param name - The name of the user (required for authenticated users)
 * @param passwordHash - The password hash to create the user account with (required for authenticated users)
 * @param requestHeaders - The request headers object
 * @returns The new user account
 */

/**
 * Create a new anonymous user account with a new chat and welcome message.
 * Anonymous users have no name, email, or password.
 *
 * @param chatId - The ID of the chat to create
 * @param requestHeaders - The request headers object
 * @returns The new user account
 */
export async function createAnonymousUser({
  chatId,
  requestHeaders,
}: {
  chatId: string;
  requestHeaders: Headers;
}): Promise<UserGetPayload<{ include: { chats: true } }>> {
  return await createUser({ chatId, isAnonymous: true, requestHeaders });
}

/**
 *
 * Create a new authenticated user account with a new chat and welcome message.
 * Authenticated users have a name, email, and password.
 *
 * @param chatId - The ID of the chat to create
 * @param email - The email of the user
 * @param name - The name of the user
 * @param passwordHash - The password hash to create the user account with
 * @param requestHeaders - The request headers object
 * @returns The new user account
 */
async function createAuthenticatedUser({
  chatId,
  email,
  name,
  passwordHash,
  requestHeaders,
}: {
  chatId: string;
  email: string;
  name: string;
  passwordHash: string;
  requestHeaders: Headers;
}): Promise<UserGetPayload<{ include: { chats: true } }>> {
  return await createUser({
    chatId,
    email,
    isAnonymous: false,
    name,
    passwordHash,
    requestHeaders,
  });
}

async function createUser({
  chatId,
  email,
  isAnonymous,
  name,
  passwordHash,
  requestHeaders,
}: {
  chatId: string;
  requestHeaders: Headers;
} & (
  | {
      isAnonymous: true;
      name?: never;
      passwordHash?: never;
      email?: never;
    }
  | {
      isAnonymous: false;
      email: string;
      name: string;
      passwordHash: string;
    }
)): Promise<UserGetPayload<{ include: { chats: true } }>> {
  if (isAnonymous)
    invariant(
      !(Boolean(name) && Boolean(email) && Boolean(passwordHash)),
      "name, email, and passwordHash are not allowed for anonymous users",
    );
  else
    invariant(
      Boolean(name) && Boolean(email) && Boolean(passwordHash),
      "name, email, and passwordHash are required for authenticated users",
    );

  const id = ulid();
  const utm = await readUtmParams(requestHeaders);
  const { ip, location } = await geocodeFromHeaders(requestHeaders);
  const userAgent = utm.userAgent ?? "";
  const deviceInfo = getDeviceInfo(requestHeaders);
  const isAdmin = email ? adminEmails.includes(email) : false;
  // NOTE: Users must have unique emails in their index
  const uniqueEmail = isAnonymous ? `anonymous-${id}@rentail.space` : email;

  return await prisma.user.create({
    data: {
      // NOTE: Users must have unique emails in their index
      email: uniqueEmail,
      geocode: JSON.stringify(location),
      id,
      ip,
      isAdmin,
      isAnonymous,
      isBot: isCrawler(userAgent) || (await isBotByIP(ip)),
      isMCP: false,
      isMobile: deviceInfo.isMobile,
      metadata: {},
      name: isAnonymous ? undefined : name,
      passwordHash: isAnonymous ? undefined : passwordHash,
      referrer: utm.referer ?? "",
      userAgent,
      utm: JSON.stringify(utm),
      viewport:
        deviceInfo.viewportWidth && deviceInfo.viewportHeight
          ? {
              width: deviceInfo.viewportWidth,
              height: deviceInfo.viewportHeight,
            }
          : undefined,
      workingMemory: JSON.stringify({ location }),

      chats: {
        create: {
          id: chatId,
          metadata: {},
          messages: {
            create: [
              {
                content: [{ type: "text", text: welcome }],
                id: ulid(),
                role: "assistant",
                type: "text",
              },
            ],
          },
        },
      },
    },
    include: { chats: true },
  });
}

async function createSession({
  requestHeaders,
  userId,
}: {
  requestHeaders: Headers;
  userId: string;
}): Promise<Headers> {
  const session = await getSession(requestHeaders.get("Cookie"));
  const sessionToken = ulid();
  await prisma.session.create({
    data: {
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days
      id: ulid(),
      ipAddress: requestHeaders.get("x-real-ip"),
      token: sessionToken,
      userAgent: requestHeaders.get("user-agent"),
      userId,
    },
  });
  session.set("token", sessionToken);
  const headers = new Headers();
  headers.append("set-cookie", await commitSession(session));
  // The marker tells the browser to fetch the session; the document itself
  // stays free of user state so it can be cached at the CDN.
  headers.append("set-cookie", userMarkerCookie(SESSION_MAX_AGE));
  return headers;
}
