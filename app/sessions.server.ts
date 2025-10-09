import type { MastraMessageV2 } from "@mastra/core";
import { captureException } from "@sentry/react-router";
import { invariant } from "es-toolkit";
import { createIsbotFromList, list } from "isbot";
import type { ChatGetPayload } from "prisma/generated/models";
import zod from "zod";
import authServer from "~/lib/auth.server";
import prisma from "~/lib/prisma";
import { getRecentMessages, updateWorkingMemory } from "~/lib/workingMemory";

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

  if (isBot(headers.get("User-Agent") ?? "")) {
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
    ip: "146.70.195.182",
    latitude: 37.4224,
    longitude: -122.08421,
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
const isBot: (userAgent: string) => boolean = createIsbotFromList(
  list.filter((record: string): boolean => !/headless/i.test(record)),
);
