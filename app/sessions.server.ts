import { reverse } from "node:dns/promises";
import type { MastraMessageV2 } from "@mastra/core";
import { captureException } from "@sentry/react-router";
import debug from "debug";
import { invariant } from "es-toolkit";
import { createIsbotFromList, list } from "isbot";
import type { ChatGetPayload } from "prisma/generated/models";
import zod from "zod";
import authServer from "~/lib/auth.server";
import prisma from "~/lib/prisma";
import { getRecentMessages, updateWorkingMemory } from "~/lib/workingMemory";

// List of user agents that are considered bots
const botUserAgents = [
  "Android 9",
  "BetterStack",
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
 * Get the chat for the user from the session. If no chat is found, a new one is
 * created. Includes recent messages in the chat.
 *
 * @param headers - The headers object
 * @returns The chat, recent messages, and HTTP headers
 */
export async function getUserChat(headers: Headers): Promise<{
  chat: ChatGetPayload<{ include: { user: true } }>;
  headers: Headers;
  messages: MastraMessageV2[];
}> {
  try {
    const session = await authServer.api.getSession({
      headers,
      returnHeaders: true,
    });
    const userId = session.response?.user.id;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const { chat, messages } = await getChatForUser(user);
        return { chat, messages, headers: session.headers };
      }
    }
  } catch (error) {
    captureException(error, { extra: { headers } });
  }

  const userAgent = headers.get("user-agent") ?? "";
  const ip = headers.get("x-forwarded-for") ?? "";
  const isBot = isUABot(userAgent) || (await isGoogleIP(ip));

  // If it's a bot, reuse the existing bot user
  if (isBot) {
    const bot = await prisma.user.findFirst({ where: { isBot: true } });
    if (bot) {
      const { chat, messages } = await getChatForUser(bot);
      return { chat, messages, headers: headers };
    }
  }

  const geocode = await geocodeIP(headers);
  const anonymous = await authServer.api.signInAnonymous({
    returnHeaders: true,
  });
  invariant(anonymous.response?.user.id, "Anonymous user ID is required");
  const user = await prisma.user.update({
    where: { id: anonymous.response.user.id },
    data: {
      cityStateCountry: [geocode.city, geocode.state, geocode.country]
        .filter(Boolean)
        .join(", "),
      geocode,
      ip: headers.get("x-forwarded-for") ?? "",
      referrer: headers.get("referer") ?? "",
      userAgent,
      isBot: isBot,
    },
  });
  const { chat, messages } = await getChatForUser(user);
  await updateWorkingMemory(chat, (profile) => ({
    location: geocode,
    ...profile,
  }));
  return { chat, messages, headers: anonymous.headers };
}

/**
 * Get the chat for a user. If no chat is found, a new one is created. Includes
 * all messages in the chat.
 *
 * @param userId - The user ID
 * @returns chat - Chat with messages and user
 * @returns messages - Messages from the chat
 */
async function getChatForUser(user: { id: string }): Promise<{
  chat: ChatGetPayload<{ include: { user: true } }>;
  messages: MastraMessageV2[];
}> {
  const chat =
    (await prisma.chat.findFirst({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      where: { userId: user.id },
    })) ||
    (await prisma.chat.create({
      data: { metadata: {}, user: { connect: { id: user.id } } },
      include: { user: true },
    }));
  const messages = await getRecentMessages(chat);
  return { chat, messages };
}

/**
 * Get the location information from the headers: IP, latitude, longitude, etc.
 *
 * @param headers - The headers object
 * @returns The location
 */
export async function geocodeIP(
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
async function isGoogleIP(ip: string): Promise<boolean> {
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
