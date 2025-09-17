import type { Conversation, Message, User } from "prisma/generated/client";
import { createCookieSessionStorage, type Session } from "react-router";
import invariant from "tiny-invariant";
import env from "./lib/env";
import prisma from "./lib/prisma";

type SessionData = {
  user_id?: string;
  conversation_id?: string;
  location?: {
    ip: string;
    latitude: string;
    longitude: string;
  };
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
  user: User;
  session: SessionType;
}> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("user_id");
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return { user, session };
  }

  const { location } = await getLocationFromRequest(request);
  const newUser = await prisma.user.create({
    data: {
      ip: location?.ip,
      latitude: location?.latitude,
      longitude: location?.longitude,
    },
  });
  session.set("user_id", newUser.id);
  return { user: newUser, session };
}

/**
 * Get the conversation from the session. If no conversation is found, a new one
 * is created. Includes all messages in the conversation. Will update the session
 * with the new conversation ID.
 *
 * @param request - The request object
 * @returns The conversation, user, and the updated session
 */
export async function getConversationFromSession(request: Request): Promise<{
  user: User;
  session: SessionType;
  conversation: Conversation & { messages: Message[] };
}> {
  const { user, session } = await getUserFromSession(request);

  const conversationId = session.get("conversation_id");
  if (conversationId) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId, userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (conversation) return { user, conversation, session };
  }

  const newConversation = await prisma.conversation.create({
    data: { user: { connect: { id: user.id } } },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  session.set("conversation_id", newConversation.id);
  return { user, conversation: newConversation, session };
}

/**
 * Get the location information from the request: IP, latitude, longitude, etc.
 *
 * @param request - The request object
 * @param session - The session object
 * @returns The location and the updated session
 */
async function getLocationFromRequest(request: Request): Promise<{
  location?: {
    ip: string;
    latitude: string;
    longitude: string;
  };
  session: SessionType;
}> {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.get("location"))
    return { session, location: session.get("location") };

  const clientIp = request.headers.get("x-forwarded-for");
  if (!clientIp) return { session };

  try {
    const url = new URL("https://api.ipgeolocation.io/v2/ipgeo");
    url.searchParams.set("apiKey", env.IPGEOLOCATION_API_KEY);
    url.searchParams.set("ip", clientIp);
    url.searchParams.set("fields", "time_zone,location");
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });
    invariant(response.ok, "Failed to fetch IP geolocation data");

    const data = (await response.json()) as IPData;
    const location = {
      city: data.location.city,
      ip: clientIp,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      state_code: data.location.state_code,
      zipcode: data.location.zipcode,
    };
    session.set("location", location);
    return { session, location };
  } catch (error) {
    console.error("Error fetching IP geolocation data:", error);
    return { session };
  }
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
