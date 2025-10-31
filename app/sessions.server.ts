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
import { cleanParse } from "./lib/userProfile";

// List of user agents that are considered bots
const botUserAgents = [
  "Android 9",
  "Better Stack",
  "CFNetwork",
  "Checkly",
  "FastmailUA",
  "Vercel",
];

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
 * Get the chat for the user from the session. The chat referenced the user.
 * Also returns the recent messages in the chat. If this is a new chat, returns
 * the initial welcome message.
 *
 * @param headers - The headers object
 * @returns The chat (optional) and recent messages
 */
export async function findUserAndChat(
  headers: Headers,
): Promise<{ chat?: Chat; messages: UIMessage[]; user?: User }> {
  const session = await authServer.api.getSession({ headers });
  if (session?.user) {
    const user = await prisma.user.findUnique({
      include: {
        chats: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      where: { id: session.user.id },
    });
    const chat = user?.chats[0];
    if (chat) {
      const messages = await recentMessages(chat.id);
      return { chat, messages, user };
    }
  }

  return {
    // No user, no chat, only the initial welcome message
    messages: [
      {
        role: "assistant",
        parts: [{ text: welcome, type: "text" }],
        id: ulid(),
      },
    ],
  };
}

/**
 * Find or create a user and chat. Returns the chat, which references the user,
 * and the recent messages in the chat. Also returns the HTTP headers which have
 * the session cookie set.
 *
 * @param headers - The headers object
 * @param chatId - The chat ID to find or create
 * @returns The chat, recent messages, and HTTP headers
 */
export async function findOrCreateUser({
  chatId,
  headers,
}: {
  chatId: string;
  headers: Headers;
}): Promise<{
  chat: Chat;
  headers: Headers;
  messages: UIMessage[];
  user: User;
}> {
  const found = await findUserAndChat(headers);
  if ("chat" in found && "user" in found) {
    invariant(found.chat?.id === chatId, "Chat ID mismatch");
    invariant(found.user, "User is required");
    return {
      chat: found.chat,
      headers: new Headers(),
      messages: found.messages,
      user: found.user,
    };
  }

  // We're gong to sign in the anonymous user so we can get the HTTP headers
  const anonymousUser = await authServer.api.signInAnonymous({
    returnHeaders: true,
  });
  invariant(anonymousUser.response?.user.id, "Anonymous user ID is required");

  // Update the anonymous user with the initial fields (IP, geocode, user agent,
  // referrer, etc.)
  const user = await prisma.user.update({
    data: await getInitialFields(headers),
    where: { id: anonymousUser.response.user.id },
  });
  const chat = await prisma.chat.create({
    data: {
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
      user: { connect: { id: user.id } },
    },
    include: { user: true },
  });
  const data = cleanParse(user.workingMemory);
  await prisma.user.update({
    data: {
      workingMemory: JSON.stringify({ location: user.geocode, ...data }),
    },
    where: { id: user.id },
  });

  const messages = await recentMessages(chat.id);
  return { chat, headers: anonymousUser.headers, messages, user };
}

/**
 * Get 50 most recent messages for a chat.
 *
 * @param chatId - The chat ID
 * @returns The 50 most recent messages
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
 * address, geocode, user agent, referrer, etc.
 *
 * @param headers - The headers object
 * @returns The initial fields for the user
 */
async function getInitialFields(headers: Headers): Promise<{
  cityStateCountry: string;
  geocode: zod.infer<typeof cachedLocation>;
  isBot: boolean;
  referrer: string;
  userAgent: string;
}> {
  const geocode = await geocodeFromHeaders(headers);
  const ip = headers.get("x-forwarded-for") ?? "";
  const userAgent = headers.get("user-agent") ?? "";
  const isBot = isUABot(userAgent) || (await isBotByIP(ip));
  const cityStateCountry = [geocode.city, geocode.state, geocode.country]
    .filter(Boolean)
    .join(", ");
  const referrer = headers.get("referer") ?? "";
  return { cityStateCountry, geocode, isBot, referrer, userAgent };
}

/**
 * Get the location information from the headers: IP, latitude, longitude, etc.
 *
 * @param headers - The headers object
 * @returns The location
 */
async function geocodeFromHeaders(
  headers: Headers,
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
        headers.get("x-vercel-ip-city") ?? fallback.city,
      ),
      country: headers.get("x-vercel-ip-country") ?? fallback.country,
      ip: headers.get("x-forwarded-for") ?? fallback.ip,
      latitude: Number.parseFloat(
        headers.get("x-vercel-ip-latitude") ?? fallback.latitude.toString(),
      ),
      longitude: Number.parseFloat(
        headers.get("x-vercel-ip-longitude") ?? fallback.longitude.toString(),
      ),
      state: headers.get("x-vercel-ip-country-region") ?? fallback.state,
      timeZone: headers.get("x-vercel-ip-timezone") ?? fallback.timeZone,
    };
  } catch (error) {
    captureException(error, { extra: { headers } });
    return fallback;
  }
}

/**
 * Check if the user agent is a bot. In testing, we treat headless Chrome as a
 * real user.
 *
 * @param userAgent - The user agent
 * @returns True if the user agent is a bot, false otherwise
 */
const isUABot: (userAgent: string) => boolean = createIsbotFromList(
  list
    .filter((record: string): boolean => !/headless/i.test(record))
    .concat(botUserAgents),
);

/**
 * Check if an IP address is from Google's domains by performing reverse DNS lookup.
 * This helps verify if a request is actually from Google's crawlers.
 *
 * @param ip - The IP address to check
 * @returns True if the IP resolves to a Google domain, false otherwise
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
