import { captureException } from "@sentry/react-router";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous } from "better-auth/plugins";
import type { User } from "prisma/generated/client";
import prisma from "./prisma";
import sendVerificationEmail from "./send-verification-email";
import sendWelcomeEmail from "./send-welcome-email";

/**
 * @see https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/types/options.ts
 */

export default betterAuth({
  appName: "rentail.space",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailVerification: {
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        url,
      });
    },
    sendOnSignUp: false, // Don't send on signup, only on email change
  },

  emailAndPassword: {
    autoSignIn: true,
    enabled: true,
    maxPasswordLength: 128,
    minPasswordLength: 8,
    requireEmailVerification: false,
    resetPasswordTokenExpiresIn: 3600, // 1 hour
    sendResetPassword: async ({ user, url }) => {
      // TODO: Send password reset email
      console.info(`[EMAIL] Password reset link for ${user.email}: ${url}`);
    },
  },

  plugins: [
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        console.log("!!!! onLinkAccount", anonymousUser, newUser);
        const from = anonymousUser.user as unknown as User;
        newUser.user.geocode = from.geocode;
        newUser.user.ip = from.ip;
        newUser.user.isAnonymous = false;
        newUser.user.workingMemory = from.workingMemory;
      },
    }),
  ],

  user: {
    additionalFields: {
      geocode: {
        type: "string",
        required: true,
        defaultValue: "{}",
      },
      ip: {
        type: "string",
        defaultValue: "",
        required: false,
      },
      workingMemory: {
        type: "string",
        required: false,
        defaultValue: "",
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ newEmail, user, url }) => {
        await sendVerificationEmail({
          email: newEmail,
          name: user.name,
          url,
        });
      },
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Short maxAge ensures session gets refreshed regularly
    },
    expiresIn: 365 * 24 * 60 * 60, // 365 days
  },

  account: {
    accountLinking: {
      allowDifferentEmails: true,
      enabled: true,
      trustedProviders: ["email-password"],
    },
  },

  trustedOrigins: ["http://localhost:*", "https://rentail.space"],

  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-client-ip", "x-forwarded-for"],
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
        after: async (user) => {
          // Send welcome email to non-anonymous users
          if (!user.isAnonymous && user.email && user.name) {
            // Don't await - send email in background to avoid blocking
            try {
              sendWelcomeEmail(user);
            } catch (error) {
              captureException(error);
            }
          }
        },
      },
    },
  },

  onAPIError: {
    onError: (error) => {
      captureException(error);
    },
    errorURL: "/error",
  },

  telemetry: {
    enabled: false,
  },
} satisfies BetterAuthOptions);
