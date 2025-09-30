import { betterAuth, type GenericEndpointContext } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous } from "better-auth/plugins";
import { invariant } from "es-toolkit";
import type { User } from "prisma/generated/client";
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

  plugins: [
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        Object.assign(newUser.user, {
          geocode: anonymousUser.user.geocode,
          ip: anonymousUser.user.ip,
          workingMemory: anonymousUser.user.workingMemory,
        } as Partial<User>);
      },
    }),
  ],

  user: {
    additionalFields: {
      geocode: {
        type: "string",
        required: true,
        defaultValue: "{}",
        description: "The user's geocode",
      },
      ip: {
        type: "string",
        defaultValue: "",
        required: true,
        description: "The user's IP address",
      },
      workingMemory: {
        type: "string",
        required: true,
        defaultValue: "",
        description: "The user's working memory",
      },
    },
  },
  session: {
    additionalFields: {
      ipAddress: { type: "string" },
      location: { type: "string" },
    },
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Short maxAge ensures session gets refreshed regularly
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
