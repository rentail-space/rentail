import { betterAuth, type GenericEndpointContext } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { invariant } from "es-toolkit";
import { getLocationFromRequest } from "~/sessions.server";
import prisma from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    autoSignIn: true,
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },
  trustedOrigins: ["http://localhost:*", "https://rentail.space"],

  user: {
    additionalFields: {
      geocode: {
        type: "string",
      },
    },
  },
  session: {
    additionalFields: {
      ipAddress: { type: "string" },
      location: { type: "string" },
    },
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-client-ip", "x-forwarded-for"],
      disableIpTracking: false,
    },
  },
  logger: {
    disabled: false,
    disableColors: false,
    level: "debug",
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context?: GenericEndpointContext) => {
          invariant(context?.request, "Request context is required");
          const geocode = await getLocationFromRequest(context?.request);
          return { data: { ...user, geocode, ip: geocode.ip } };
        },
      },
    },
  },
});
