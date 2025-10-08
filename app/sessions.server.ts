import type { MastraMessageV2 } from "@mastra/core";
import { captureException } from "@sentry/react-router";
import { invariant } from "es-toolkit";
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
    latitude: zod.string(),
    longitude: zod.string(),
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

  if (
    /UptimeRobot|StatusCake|Pingdom|Checkly|Better Uptime Bot/.test(
      headers.get("user-agent") ?? "",
    )
  ) {
    const ip = "0.0.0.0";
    headers.set("x-forwarded-for", ip);
    const bot = await prisma.user.findFirst({ where: { ip } });
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
  return {
    city: headers.get("x-vercel-ip-city") ?? "Los Angeles",
    country: headers.get("x-vercel-ip-country") ?? "United States",
    ip: headers.get("x-forwarded-for") ?? "146.70.195.182",
    latitude: headers.get("x-vercel-ip-latitude") ?? "37.42240",
    longitude: headers.get("x-vercel-ip-longitude") ?? "-122.08421",
    state: headers.get("x-vercel-ip-country-region") ?? "California",
    timeZone: headers.get("x-vercel-ip-timezone") ?? "America/Los_Angeles",
  };
}
