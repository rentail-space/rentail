import { captureException } from "@sentry/react-router";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous, type UserWithAnonymous } from "better-auth/plugins";
import { invariant } from "es-toolkit";
import prisma from "./prisma";
import sendVerificationEmail from "./send-verification-email";
import sendWelcomeEmail from "./send-welcome-email";
import { getRecentMessages, saveMessages } from "./workingMemory";

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
      onLinkAccount: async ({ anonymousUser: anonUser, newUser }) => {
        await copyAnonToNewUser(anonUser.user, newUser.user);
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
      updateUserInfoOnLink: true,
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
          // Send welcome email to non-anonymous users, don't await to avoid blocking
          if (!user.isAnonymous) sendWelcomeEmail(user);
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

/**
 * Copy the anonymous user's data to the new user. We need to go through this
 * process because we're not allowed to just change the user's ID, and we need
 * to duplicate their chats, messages, and working memory.
 *
 * @param anonUser - The anonymous user.
 * @param newUser - The new user.
 */
async function copyAnonToNewUser(
  anonUser: UserWithAnonymous,
  newUser: Omit<UserWithAnonymous, "isAnonymous">,
) {
  invariant(anonUser.id, "Anonymous user ID is required");
  invariant(newUser.id, "New user ID is required");
  // Copy the anonymous user's saved data to the new user.
  const anonSaved = await prisma.user.findUnique({
    where: { id: anonUser.id },
    select: { workingMemory: true, ip: true, geocode: true },
  });
  await prisma.user.update({
    data: {
      workingMemory: anonSaved?.workingMemory,
      ip: anonSaved?.ip || "146.70.195.182",
      geocode: anonSaved?.geocode || "{}",
    },
    where: { id: newUser.id },
  });

  // Duplicate the anonymous user's last chat.
  const anonChat = await prisma.chat.findFirst({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    where: { user: { id: anonUser.id } },
  });
  const newChat = await prisma.chat.create({
    data: { user: { connect: { id: newUser.id } } },
    include: { user: true },
  });

  // Copy the anonymous user's messages to the new user.
  const anonMessages = anonChat ? await getRecentMessages(anonChat) : [];
  await saveMessages(newChat, anonMessages);
}
