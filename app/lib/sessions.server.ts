import type { TextUIPart, UIMessage } from "ai";
import bcrypt from "bcrypt";
import debug from "debug";
import { invariant } from "es-toolkit";
import { createIsbotFromList, list } from "isbot";
import { reverse } from "node:dns/promises";
import type { Chat, User } from "prisma/generated/client";
import type { UserGetPayload } from "prisma/generated/models";
import {
  type Session,
  createCookieSessionStorage,
  redirect,
} from "react-router";
import { ulid } from "ulid";
import sendNewUserNotification from "~/emails/NewUserNotification";
import sendWelcomeEmail from "~/emails/WelcomeEmail";
import { getDeviceInfo } from "~/lib/deviceDetection.server";
import envVars from "~/lib/env";
import { readUtmParams, saveUtmParams } from "~/lib/middleware/utm";
import prisma from "~/lib/prisma";
import welcome from "~/prompts/welcome.md?raw";
import { geocodeFromHeaders } from "./geocode";

type SessionData = {
  token: string;
};

type SessionFlashData = {
  error: string;
};

const adminEmails = ["assaf@labnotes.org"];

// List of user agents that are considered bots
const botUserAgents = [
  "Android 9",
  "Better Stack",
  "CFNetwork",
  "Checkly",
  "FastmailUA",
  "Vercel",
];

const logger = debug("server:sessions");

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: "__session",
      domain: envVars.isProduction ? "rentail.space" : "localhost",
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60, // 365 days
      path: "/",
      sameSite: "lax",
      secrets: [envVars.BETTER_AUTH_SECRET],
      secure: envVars.isProduction,
    },
  });

/**
 * Get the most recent chat for the user from the session. If the user exists,
 * there must be a last chat for the user. Also return the recent messages in
 * the chat, the HTTP headers with the session cookie set, and whether the user
 * is an admin.
 *
 * @param request - The request object
 * @returns The last chat, messages, response headers with the session cookie
 * set, user. If the user is not found, return the response headers with the
 * session cookie set.
 */
export async function findUserAndLastChat(request: Request): Promise<
  | {
      chat: Chat;
      messages: UIMessage[];
      responseHeaders: Headers;
      user: User;
    }
  | {
      responseHeaders: Headers;
    }
> {
  const session = await userFromCookie(request.headers);
  if (!("user" in session)) return await saveUtmParams(request);

  const { user } = session;
  const chat = await prisma.chat.findFirst({
    orderBy: { createdAt: "desc" },
    take: 1,
    where: { userId: user.id },
  });
  if (!chat) return { responseHeaders: new Headers() };

  const messages = await recentMessages(chat.id);
  const { responseHeaders } = await saveUtmParams(request);
  responseHeaders.append(
    "set-cookie",
    await commitSession(session.cookieSession),
  );
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
  // Ensure correct transformation to ModelMessage[]
  return recent.reverse().map((message) => ({
    id: message.id,
    parts: message.content as TextUIPart[],
    role: message.role,
  }));
}

/**
 * Check if the user agent is a bot. In testing, we treat headless Chrome as a
 * real user. The list of bots is defined in the botUserAgents array.
 *
 * @param userAgent - The user agent to check
 * @returns True if the user agent is a bot, false otherwise
 */
const isUABot: (userAgent: string) => boolean = createIsbotFromList(
  list
    .filter((record: string): boolean => !/headless/i.test(record))
    .concat(botUserAgents),
);

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
  if ("user" in session && session.user.isAdmin) return session.user;
  else throw redirect("/");
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
  | {
      cookieSession: Session<SessionData, SessionFlashData>;
    }
> {
  const cookieSession = await getSession(requestHeaders.get("cookie"));
  if (!cookieSession.data.token) return { cookieSession };

  const session = await prisma.session.findFirst({
    include: { user: true },
    where: { token: cookieSession.data.token, expiresAt: { gt: new Date() } },
  });
  const user = session?.user;
  if (!user) return { cookieSession };

  const responseHeaders = new Headers({
    "set-cookie": await commitSession(cookieSession),
  });
  return { cookieSession, user, responseHeaders };
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
    const isAnonymous = false;
    const isAdmin = adminEmails.includes(email);
    const updatedUser = await prisma.user.update({
      data: { isAdmin, isAnonymous, name, email, passwordHash },
      where: { id: anonymousUser.id },
    });
    await sendWelcomeEmail(updatedUser);
    if (envVars.isProduction) await sendNewUserNotification(updatedUser);
    return await createSession({ requestHeaders, userId: updatedUser.id });
  }

  // Is this email already in use? If so, sign in the user.
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser)
    return await signInEmail({ email, password, requestHeaders });

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
  await prisma.session.delete({
    where: { token: session.data.token },
  });
  return new Headers({ "set-cookie": await destroySession(session) });
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
  const geocode = await geocodeFromHeaders(requestHeaders);
  const userAgent = utm.userAgent ?? "";
  const deviceInfo = getDeviceInfo(requestHeaders);
  const isAdmin = email ? adminEmails.includes(email) : false;
  // NOTE: Users must have unique emails in their index
  const uniqueEmail = isAnonymous ? `anonymous-${id}@rentail.space` : email;

  return await prisma.user.create({
    data: {
      // NOTE: Users must have unique emails in their index
      email: uniqueEmail,
      geocode,
      id,
      ip: geocode.ip,
      isAdmin,
      isAnonymous,
      isBot: isUABot(userAgent) || (await isBotByIP(geocode.ip)),
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
      workingMemory: JSON.stringify({ location: geocode }),

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
  return new Headers({ "set-cookie": await commitSession(session) });
}
