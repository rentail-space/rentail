import { invariant } from "es-toolkit";
import type { User } from "prisma/generated/client";
import type { ChatGetPayload } from "prisma/generated/models";
import { createCookieSessionStorage, type Session } from "react-router";
import env from "./lib/env";
import prisma from "./lib/prisma";

type SessionData = {
  user_id?: string;
  chat_id?: string;
  location?: Location;
};

type Location = {
  city: string;
  country: string;
  state: string;
  ip: string;
  latitude: string;
  longitude: string;
};

type SessionFlashData = {
  error: string;
};

type SessionType = Session<SessionData, SessionFlashData>;

const DEFAULT_LOCATION: Location = {
  city: "Los Angeles",
  country: "United States",
  ip: "23.241.26.38", // My IP address
  latitude: "34.044727",
  longitude: "-118.249283",
  state: "California",
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
  const userId = session.get("user_id");
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return { user, session };
  }

  const { location } = await getLocationFromRequest(request);
  const newUser = await prisma.user.create({
    data: { ip: location?.ip, location: location },
  });
  session.set("user_id", newUser.id);
  return { user: newUser, session };
}

/**
 * Get the chat from the session. If no chat is found, a new one
 * is created. Includes all messages in the chat. Will update the session
 * with the new chat ID.
 *
 * @param request - The request object
 * @returns chat - Chat with messages and user
 * @returns session - The updated session
 */
export async function getChatFromSession(request: Request): Promise<{
  chat: ChatGetPayload<{ include: { messages: true; user: true } }>;
  session: SessionType;
}> {
  const { user, session } = await getUserFromSession(request);

  const chatId = session.get("chat_id");
  if (chatId) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId, userId: user.id },
      include: { messages: { orderBy: { id: "asc" } }, user: true },
    });
    if (chat) return { chat, session };
  }

  const newChat = await prisma.chat.create({
    data: { user: { connect: { id: user.id } } },
    include: { messages: true, user: true },
  });
  session.set("chat_id", newChat.id);
  return { chat: newChat, session };
}

/**
 * Get the location information from the request: IP, latitude, longitude, etc.
 *
 * @param request - The request object
 * @param session - The session object
 * @returns The location and the updated session
 */
async function getLocationFromRequest(request: Request): Promise<{
  location?: Location;
  session: SessionType;
}> {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.get("location"))
    return { session, location: session.get("location") };

  try {
    const clientIp = request.headers.get("x-forwarded-for");
    const location = await geocode(clientIp);
    session.set("location", location);
    return { session, location };
  } catch (error) {
    console.error("[GEOCODE] Error fetching IP geolocation data:", error);
    return { session, location: DEFAULT_LOCATION };
  }
}

async function geocode(clientIp: string | null): Promise<Location> {
  // In development, we use my IP address, since x-forwarded-for is not set.
  if (!clientIp) return DEFAULT_LOCATION;

  console.info("[GEOCODE] Fetching IP geolocation data for IP %s", clientIp);
  const url = new URL("https://api.ipgeolocation.io/v2/ipgeo");
  url.searchParams.set("apiKey", env.IPGEOLOCATION_API_KEY);
  url.searchParams.set("ip", clientIp);
  url.searchParams.set("fields", "time_zone,location");
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  invariant(response.ok, "Failed to fetch IP geolocation data");
  const data = (await response.json()) as IPData;
  return {
    city: data.location.city,
    country: data.location.country_code2,
    ip: clientIp,
    latitude: data.location.latitude,
    longitude: data.location.longitude,
    state: data.location.state_prov,
  };
}

// See https://ipgeolocation.io/ip-location-api.html#documentation-overview
type IPData = {
  location: {
    country_code2: string; // eg "US"
    country_name: string; // eg "United States"
    state_prov: string; // eg "California"
    state_code: string; // eg "US-CA"
    city: string; // eg "Mountain View"
    accuracy_radius: string; // eg "5"
    confidence: string; // eg "High"
    zipcode: string; // eg "94043-1351"
    latitude: string; // eg "37.42240"
    longitude: string; // eg "-122.08421"
  };
};
