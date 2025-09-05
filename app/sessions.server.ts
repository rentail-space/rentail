import type { Conversation, Message, User } from "prisma/generated/client";
import { createCookieSessionStorage, type Session } from "react-router";
import invariant from "tiny-invariant";
import serverConfig from "./lib/config";
import prisma from "./lib/prisma";

type SessionData = {
  user_id?: string;
  conversation_id?: string;
  location?: {
    ip?: string;
    time_zone?: string;
    state_code?: string;
    city?: string;
    zipcode?: string;
    latitude?: string;
    longitude?: string;
  };
};

type SessionFlashData = {
  error: string;
};

export type SessionType = Session<SessionData, SessionFlashData>;

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      httpOnly: true,
      isSigned: true,
      maxAge: 60 * 60 * 24 * 365, // 365 days
      name: "__session",
      path: "/",
      secrets: [serverConfig.SESSION_SECRET],
    },
  });

export { getSession, commitSession, destroySession };

export async function getUserFromSession(
  request: Request,
  session: SessionType,
): Promise<User> {
  await getLocationFromRequest(request, session);

  const userId = session.get("user_id");
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user;
  }

  const newUser = await prisma.user.create({ data: {} });
  session.set("user_id", newUser.id);
  return newUser;
}

export async function getConversationFromSession(
  request: Request,
  session: SessionType,
): Promise<{
  user: User;
  conversation: Conversation & { messages: Message[] };
}> {
  const user = await getUserFromSession(request, session);

  const conversationId = session.get("conversation_id");
  if (conversationId) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId, userId: user.id },
      include: { messages: true },
    });
    if (conversation) return { user, conversation };
  }

  const newConversation = await prisma.conversation.create({
    data: {
      messages: {
        create: {
          content:
            "Hello, I'm **Rentail** — how can I help you find a pop-up retail space for your business?",
          role: "ASSISTANT",
        },
      },
      user: { connect: { id: user.id } },
    },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  session.set("conversation_id", newConversation.id);
  return { user, conversation: newConversation };
}

async function getLocationFromRequest(
  request: Request,
  session: SessionType,
): Promise<void> {'
  if (session.get("location")) return;

  try {
    const clientIp = request.headers.get("x-forwarded-for");
    invariant(clientIp, "Client IP is required");

    const url = new URL("https://api.ipgeolocation.io/v2/ipgeo");
    url.searchParams.set("apiKey", serverConfig.IPGEOLOCATION_API_KEY);
    url.searchParams.set("ip", clientIp);
    url.searchParams.set("fields", "time_zone,location");
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });
    invariant(response.ok, "Failed to fetch IP geolocation data");

    const data = (await response.json()) as IPData;
    session.set("location", {
      city: data.location.city,
      ip: clientIp,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      state_code: data.location.state_code,
      zipcode: data.location.zipcode,
    });
  } catch (error) {
    console.error("Error fetching IP geolocation data:", error);
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
