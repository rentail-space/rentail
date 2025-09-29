import type { MastraMessageV2 } from "@mastra/core";
import { captureException } from "@sentry/react-router";
import { invariant } from "es-toolkit";
import Redis from "ioredis";
import type { User } from "prisma/generated/client";
import type { ChatGetPayload } from "prisma/generated/models";
import { createCookieSessionStorage, type Session } from "react-router";
import zod from "zod";
import env from "./lib/env";
import prisma from "./lib/prisma";
import { getRecentMessages } from "./lib/workingMemory";

type SessionData = {
  userId?: string;
  chatId?: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession } = createCookieSessionStorage<
  SessionData,
  SessionFlashData
>({
  // a Cookie from `createCookie` or the CookieOptions to create one
  cookie: {
    httpOnly: true,
    isSigned: true,
    maxAge: 60 * 60 * 24 * 365, // 365 days
    name: "__session",
    path: "/",
    secrets: [env.SESSION_SECRET],
  },
});

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
 * Use this instead of `commitSession` to avoid hardcoding the expiration date.
 *
 * @example
 * { headers: { "Set-Cookie": await commit(session) } }
 */
export async function commit(session: Session<SessionData, SessionFlashData>) {
  return await commitSession(session, {
    expires: new Date(Date.now() + 60 * 60 * 24 * 365),
  });
}

/**
 * Get the user from the session.
 *
 * @param request - The request object
 * @returns The user and the updated session
 */
export async function getUserFromSession(request: Request): Promise<{
  session: Session<SessionData, SessionFlashData>;
  user: User;
}> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return { user, session };
  }

  const geocode = await getLocationFromRequest(request);
  const newUser = await prisma.user.create({
    data: { ip: geocode.ip, geocode: geocode },
  });
  session.set("userId", newUser.id);
  return { user: newUser, session };
}

/**
 * Get the chat from the session. If no chat is found, a new one
 * is created. Includes all messages in the chat. Will update the session
 * with the new chat ID.
 *
 * @param request - The request object
 * @returns chat - Chat with messages and user
 * @returns messages - Messages from the chat
 * @returns session - The updated session
 */
export async function getChatFromSession(request: Request): Promise<{
  chat: ChatGetPayload<{ include: { user: true } }>;
  messages: MastraMessageV2[];
  session: Session<SessionData, SessionFlashData>;
}> {
  const { user, session } = await getUserFromSession(request);

  const chatId = session.get("chatId");
  const chat = chatId
    ? await prisma.chat.findUnique({
        include: { user: true },
        where: { id: chatId, userId: user.id },
      })
    : null;
  if (chat) {
    const messages = await getRecentMessages(chat);
    return { chat, messages, session };
  } else {
    const newChat = await prisma.chat.create({
      data: { user: { connect: { id: user.id } } },
      include: { user: true },
    });
    session.set("chatId", newChat.id);
    const messages = await getRecentMessages(newChat);
    return { chat: newChat, messages, session };
  }
}

/**
 * Get the location information from the request: IP, latitude, longitude, etc.
 *
 * @param request - The request object
 * @param session - The session object
 * @returns The location and the updated session
 */
async function getLocationFromRequest(
  request: Request,
): Promise<zod.infer<typeof cachedLocation>> {
  const clientIp = request.headers.get("x-forwarded-for") ?? "146.70.195.182";

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
    captureException(error, { data: { clientIp } });
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
