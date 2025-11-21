import { captureException } from "@sentry/react-router";
import type { TextUIPart, UIMessage } from "ai";
import debug from "debug";
import { invariant } from "es-toolkit";
import { createIsbotFromList, list } from "isbot";
import { reverse } from "node:dns/promises";
import type { Chat, User } from "prisma/generated/client";
import { ulid } from "ulid";
import zod from "zod";
import authServer from "~/lib/auth.server";
import prisma from "~/lib/prisma";
import welcome from "~/prompts/welcome.md?raw";

// List of user agents that are considered bots
const botUserAgents = [
  "Android 9",
  "Better Stack",
  "CFNetwork",
  "Checkly",
  "FastmailUA",
  "Vercel",
];

const adminUsers = ["assaf@labnotes.org"];

/**
 * We use Redis to cache the location information for 30 days so we don't have
 * to geocode the IP address every time.
 */
const cachedLocation = zod
  .object({
    city: zod.string(),
    country: zod.string(),
    state: zod.string(),
    ip: zod.string(),
    latitude: zod.number(),
    longitude: zod.number(),
    timeZone: zod.string(),
  })
  .partial();

/**
 * Get the chat for the user from the session. If the user exists, there must be
 * a last chat for the user. Also return the recent messages in the chat, the HTTP
 * headers, and whether the user is an admin.
 *
 * @param requestHeaders - The request headers object
 * @returns The chat, messages, response headers, user, and whether the user is an
 * admin if found. If the user is not found, return undefined.
 */
export async function findUserAndLastChat(requestHeaders: Headers): Promise<
  | {
      chat: Chat;
      responseHeaders: Headers;
      isAdmin: boolean;
      messages: UIMessage[];
      user: User;
    }
  | undefined
> {
  const { response, headers: responseHeaders } =
    await authServer.api.getSession({
      headers: requestHeaders,
      returnHeaders: true,
    });
  if (!response?.user) return;

  const user = await prisma.user.findUnique({
    include: { chats: { orderBy: { createdAt: "desc" }, take: 1 } },
    where: { id: response?.user.id },
  });
  if (!user) return;

  const chat = user.chats[0];
  if (!chat) return;

  const messages = await recentMessages(chat.id);

  const isAdmin = user.email ? adminUsers.includes(user.email) : false;
  return { chat, responseHeaders, isAdmin, messages, user };
}

/**
 * Get the chat for the user from the session. If the user exists, there must be
 * a chat with the given chat ID, and it must belong to that user.  Also return
 * the recent messages in the chat.
 *
 * @param chatId - The ID of the chat to find
 * @param requestHeaders - The request headers object
 * @returns The chat, messages, response headers, and user if found
 * @throws If the user is not found or the chat ID mismatch is detected
 */
export async function findUserAndChatById({
  chatId,
  requestHeaders,
}: {
  chatId: string;
  requestHeaders: Headers;
}): Promise<
  | { chat: Chat; messages: UIMessage[]; responseHeaders: Headers; user: User }
  | undefined
> {
  const { response, headers: responseHeaders } =
    await authServer.api.getSession({
      headers: requestHeaders,
      returnHeaders: true,
    });
  if (!response?.user) return;

  const user = await prisma.user.findUnique({
    include: { chats: { where: { id: chatId } } },
    where: { id: response?.user.id },
  });
  if (!user) return;

  const chat = user.chats.find((chat) => chat.id === chatId);
  if (!chat) return;

  const messages = await recentMessages(chat.id);
  return { chat, messages, responseHeaders, user };
}

/**
 * Find or create a user and chat. Returns the chat, which references the user,
 * the recent messages in the chat, and the user. Also returns the HTTP headers
 * which have the session cookie set, and the user agent.
 *
 * @param chatId - The ID of the chat to find or create
 * @param requestHeaders - The request headers object
 * @returns The chat, recent messages, user, and HTTP headers
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
  const found = await findUserAndChatById({ requestHeaders, chatId });
  if (found) return { ...found, responseHeaders: new Headers() };

  // We're going to sign in the anonymous user so we can get the HTTP headers
  const { response, headers: signInHeaders } =
    await authServer.api.signInAnonymous({ returnHeaders: true });
  const anonUser = response?.user;
  invariant(anonUser, "Anonymous user ID is required");

  // Update the anonymous user with the initial fields (IP, geocode, user agent,
  // referrer, etc.). Make sure it has initial chat with the welcome message.
  const { chat, messages, user } = await updateNewUser({
    chatId,
    requestHeaders: requestHeaders,
    userId: anonUser.id,
  });
  return { chat, responseHeaders: signInHeaders, messages, user };
}

/**
 * Update the new user with the initial fields (IP, geocode, user agent,
 * referrer, etc.). Make sure it has initial chat with a welcome message.
 *
 * @param chatId - The ID of the chat to create
 * @param requestHeaders - The request headers object
 * @param userId - The user ID to update
 * @returns The updated user, chat, and messages
 */
export async function updateNewUser({
  chatId,
  requestHeaders,
  userId,
}: {
  chatId: string;
  requestHeaders: Headers;
  userId: string;
}): Promise<{ chat: Chat; messages: UIMessage[]; user: User }> {
  const existingUser = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });
  const user = await prisma.user.update({
    data: {
      ...(await getInitialFields({ existingUser, requestHeaders })),
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
    include: { chats: { include: { messages: true } } },
    where: { id: userId },
  });

  const chat = user.chats[0];
  const messages = await recentMessages(chat.id);
  return { chat, messages, user };
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
 * Get the initial fields for the user. These record the user's IP
 * address, geocode, user agent, referrer, and working memory.
 *
 * NOTE: Sometimes the user was just created by Better Auth, and so we must set
 * all the initial fields. Other times, the user already exists, and so we only
 * need to set the fields that are not already set.
 *
 * @param requestHeaders - The request headers object
 * @param existingUser - The existing user
 * @returns The initial fields for the user
 */
async function getInitialFields({
  existingUser,
  requestHeaders,
}: {
  existingUser: User;
  requestHeaders: Headers;
}): Promise<{
  cityStateCountry: string;
  geocode: zod.infer<typeof cachedLocation>;
  isBot: boolean;
  referrer: string;
  userAgent: string;
  workingMemory: string;
}> {
  const geocode = await geocodeFromHeaders(requestHeaders);
  const ip = requestHeaders.get("x-forwarded-for") ?? "";
  const userAgent = requestHeaders.get("user-agent") ?? "";
  const isBot = isUABot(userAgent) || (await isBotByIP(ip));
  const cityStateCountry = [geocode.city, geocode.state, geocode.country]
    .filter(Boolean)
    .join(", ");
  const referrer = requestHeaders.get("referer") ?? "";
  const workingMemory = JSON.stringify({ location: geocode });
  return {
    cityStateCountry: existingUser.cityStateCountry || cityStateCountry,
    geocode:
      (existingUser.geocode as zod.infer<typeof cachedLocation>) || geocode,
    isBot,
    referrer: existingUser.referrer || referrer,
    userAgent: existingUser.userAgent || userAgent,
    workingMemory: existingUser.workingMemory || workingMemory,
  };
}

/**
 * Get the location information from the headers: IP, latitude, longitude, city,
 * state, country, and time zone.  If the location information is not found,
 * return a fallback location. The fallback location is Los Angeles, California.
 *
 * @param requestHeaders - The headers object
 * @returns The location information from the headers or the fallback location
 */
async function geocodeFromHeaders(
  requestHeaders: Headers,
): Promise<zod.infer<typeof cachedLocation>> {
  const fallback = {
    city: "Los Angeles",
    country: "United States",
    state: "California",
    ip: "23.241.26.38",
    latitude: 34.0456,
    longitude: -118.2694,
    timeZone: "America/Los_Angeles",
  };
  try {
    return {
      city: decodeURIComponent(
        requestHeaders.get("x-vercel-ip-city") ?? fallback.city,
      ),
      country: requestHeaders.get("x-vercel-ip-country") ?? fallback.country,
      ip: requestHeaders.get("x-forwarded-for") ?? fallback.ip,
      latitude: Number.parseFloat(
        requestHeaders.get("x-vercel-ip-latitude") ??
          fallback.latitude.toString(),
      ),
      longitude: Number.parseFloat(
        requestHeaders.get("x-vercel-ip-longitude") ??
          fallback.longitude.toString(),
      ),
      state: requestHeaders.get("x-vercel-ip-country-region") ?? fallback.state,
      timeZone: requestHeaders.get("x-vercel-ip-timezone") ?? fallback.timeZone,
    };
  } catch (error) {
    captureException(error, { extra: { headers: requestHeaders } });
    console.error("Error getting geocode from headers: %s", error);
    return fallback;
  }
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
async function isBotByIP(ip: string): Promise<boolean> {
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
    debug("server")("Reverse DNS lookup failed for IP: %s", ip);
    return false;
  }
}
