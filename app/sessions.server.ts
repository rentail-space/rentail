import type { MastraMessageV2 } from "@mastra/core";
import { captureException } from "@sentry/react-router";
import { invariant } from "es-toolkit";
import Redis from "ioredis";
import type { ChatGetPayload } from "prisma/generated/models";
import zod from "zod";
import authServer from "~/lib/auth.server";
import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { getRecentMessages, updateWorkingMemory } from "~/lib/workingMemory";

/**
 * We use Redis to cache the location information for 30 days so we don't have
 * to geocode the IP address every time.
 */
const cachedLocation = zod.object({
  city: zod.string(),
  country: zod.string(),
  state: zod.string(),
  ip: zod.string(),
  latitude: zod.string(),
  longitude: zod.string(),
  timeZone: zod.string(),
});

const redis = new Redis(env.REDIS_URL);

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
    const current = await authServer.api.getSession({
      headers,
      returnHeaders: true,
    });
    if (current.response?.user) {
      const { chat, messages } = await getChatForUser(current.response.user);
      return { chat, messages, headers: current.headers };
    }
  } catch (error) {
    captureException(error, { extra: { headers } });
  }

  const geocode = await geocodeIP(headers);
  const anonymous = await authServer.api.signInAnonymous({
    returnHeaders: true,
    query: { geocode, ip: geocode.ip },
  });
  invariant(anonymous.response?.user, "Anonymous user not created");
  const { chat, messages } = await getChatForUser(anonymous.response.user);
  await updateWorkingMemory(chat, (profile) => ({
    ...profile,
    location: geocode,
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
      data: { user: { connect: { id: user.id } } },
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
  const clientIp = headers.get("x-forwarded-for") ?? "146.70.195.182";

  const key = `location:${clientIp}`;
  const { success, data } = cachedLocation.safeParse(await redis.get(key));
  if (success) return data;

  const geocoded = await geocode(clientIp);
  const location = cachedLocation.parse({
    city: geocoded.location.city,
    country: geocoded.location.country_name,
    ip: clientIp,
    latitude: geocoded.location.latitude,
    longitude: geocoded.location.longitude,
    state: geocoded.location.state_prov,
    timeZone: geocoded.time_zone.name,
  });
  await redis.set(key, JSON.stringify(location), "EX", 60 * 60 * 24 * 30); // 30 days
  return location;
}

async function geocode(
  clientIp: string,
): Promise<zod.infer<typeof ipDataSchema>> {
  console.info("[GEOCODE] Geocoding IP %s", clientIp);
  try {
    const url = new URL("https://api.ipgeolocation.io/v2/timezone");
    url.searchParams.set("apiKey", env.IPGEOLOCATION_API_KEY);
    url.searchParams.set("ip", clientIp);
    url.searchParams.set("fields", "time_zone,location");
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });
    invariant(response.ok, "Failed to geocode IP");
    return ipDataSchema.parse(await response.json());
  } catch (error) {
    captureException(error, { extra: { clientIp } });
    return ipDataSchema.parse(undefined);
  }
}

// See https://ipgeolocation.io/ip-location-api.html#documentation-overview
const ipDataSchema = zod
  .object({
    location: zod.object({
      country_name: zod.string(), // eg "United States"
      state_prov: zod.string(), // eg "California"
      city: zod.string(), // eg "Mountain View"
      zipcode: zod.string(), // eg "94043-1351"
      latitude: zod.string(), // eg "37.42240"
      longitude: zod.string(), // eg "-122.08421"
    }),
    time_zone: zod.object({
      name: zod.string(), // eg "America/Los_Angeles"
    }),
  })
  .catch({
    location: {
      country_name: "United States",
      state_prov: "California",
      city: "Mountain View",
      zipcode: "94043-1351",
      latitude: "34.07558",
      longitude: "-118.37841",
    },
    time_zone: { name: "America/Los_Angeles" },
  });
