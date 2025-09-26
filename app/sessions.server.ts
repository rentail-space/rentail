import type { MastraMessageV2 } from "@mastra/core";
import { captureException } from "@sentry/react-router";
import { invariant } from "es-toolkit";
import type { Chat, User } from "prisma/generated/client";
import { createCookieSessionStorage, type Session } from "react-router";
import zod from "zod";
import env from "./lib/env";
import prisma from "./lib/prisma";
import { getRecentMessages } from "./lib/workingMemory";

type SessionData = {
  userId?: string;
  chatId?: string;
  location?: Location;
};

type Location = {
  city: string;
  country: string;
  state: string;
  ip: string;
  latitude: string;
  longitude: string;
  timeZone: string;
};

type SessionFlashData = {
  error: string;
};

type SessionType = Session<SessionData, SessionFlashData>;

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
 * Use this instead of `commitSession` to avoid hardcoding the expiration date.
 *
 * @example
 * { headers: { "Set-Cookie": await commit(session) } }
 */
export async function commit(session: SessionType) {
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
  session: SessionType;
  user: User;
}> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return { user, session };
  }

  const { location } = await getLocationFromRequest(request);
  const newUser = await prisma.user.create({
    data: { ip: location.ip, location: location },
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
 * @returns user - The user
 */
export async function getChatFromSession(request: Request): Promise<{
  chat: Chat;
  messages: MastraMessageV2[];
  session: SessionType;
  user: User;
}> {
  const { user, session } = await getUserFromSession(request);

  const chatId = session.get("chatId");
  const chat = chatId
    ? await prisma.chat.findUnique({
        where: { id: chatId, userId: user.id },
      })
    : null;
  if (chat) {
    const messages = await getRecentMessages(user, chat);
    return { chat, messages, user, session };
  } else {
    const newChat = await prisma.chat.create({
      data: { user: { connect: { id: user.id } } },
    });
    session.set("chatId", newChat.id);
    const messages = await getRecentMessages(user, newChat);
    return { chat: newChat, messages, user, session };
  }
}

/**
 * Get the location information from the request: IP, latitude, longitude, etc.
 *
 * @param request - The request object
 * @param session - The session object
 * @returns The location and the updated session
 */
async function getLocationFromRequest(request: Request): Promise<{
  location: Location;
  session: SessionType;
}> {
  const session = await getSession(request.headers.get("Cookie"));
  const currentLocation = session.get("location") as Location;
  if (currentLocation) return { session, location: currentLocation };

  const clientIp = request.headers.get("x-forwarded-for") ?? "146.70.195.182";
  const data = await geocode(clientIp);
  const location: Location = {
    city: data.location.city,
    country: data.location.country_name,
    ip: clientIp,
    latitude: data.location.latitude,
    longitude: data.location.longitude,
    state: data.location.state_prov,
    timeZone: data.time_zone.name,
  };

  session.set("location", location);
  return { session, location };
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
      country_code2: zod.string(), // eg "US"
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
      country_code2: "US",
      country_name: "United States",
      state_prov: "California",
      city: "Mountain View",
      zipcode: "94043-1351",
      latitude: "37.42240",
      longitude: "-122.08421",
    },
    time_zone: { name: "America/Los_Angeles" },
  });
