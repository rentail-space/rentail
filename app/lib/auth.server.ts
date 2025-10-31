import { captureException } from "@sentry/react-router";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous, type UserWithAnonymous } from "better-auth/plugins";
import debug from "debug";
import type { InputJsonValue } from "prisma/generated/internal/prismaNamespace";
import { ulid } from "ulid";
import { sendVerificationEmail, sendWelcomeEmail } from "~/emails/sendEmails";
import prisma from "~/lib/prisma";

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
      debug("email")("Password reset link for %s: %s", user.email, url);
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
      cityStateCountry: {
        defaultValue: "",
        type: "string",
      },
      geocode: {
        defaultValue: "{}",
        required: true,
        type: "string",
      },
      ip: {
        defaultValue: "180.245.156.10",
        required: true,
        type: "string",
      },
      metadata: {
        defaultValue: "{}",
        required: true,
        type: "string",
      },
      referrer: {
        defaultValue: "",
        type: "string",
      },
      workingMemory: {
        defaultValue: "",
        type: "string",
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
 * to duplicate their chats, messages, and working memory. The anonymous user
 * will be deleted after this process.
 *
 * @param anonUser - The anonymous user.
 * @param newUser - The new user.
 */
async function copyAnonToNewUser(
  anonUser: UserWithAnonymous & Record<string, unknown>,
  newUser: Omit<UserWithAnonymous, "isAnonymous"> & Record<string, unknown>,
) {
  // Copy the anonymous user's saved data to the new user.
  // NOTE: anonUser doesn't have the workingMemory field, so we need to get it
  // from the database directly.
  const loaded = await prisma.user.findUniqueOrThrow({
    where: { id: anonUser.id },
  });
  await prisma.user.update({
    data: {
      cityStateCountry: loaded.cityStateCountry,
      geocode: loaded.geocode ?? {},
      ip: loaded.ip,
      metadata: loaded.metadata ?? {},
      referrer: loaded.referrer,
      workingMemory: loaded.workingMemory,
    },
    where: { id: newUser.id },
  });

  // Duplicate the anonymous user's last chat.
  const anonChat = await prisma.chat.findFirst({
    include: { user: true, messages: true },
    orderBy: { createdAt: "desc" },
    where: { user: { id: anonUser.id } },
  });
  const newChat = await prisma.chat.create({
    data: {
      id: ulid(),
      metadata: anonChat?.metadata ?? {},
      user: { connect: { id: newUser.id } },
    },
    include: { user: true },
  });

  // Copy the anonymous user's messages to the new user.
  if (anonChat) {
    await prisma.chat.update({
      data: {
        messages: {
          createMany: {
            data: anonChat.messages.map((message) => ({
              content: message.content as InputJsonValue,
              role: message.role,
              id: ulid(),
              type: message.type,
            })),
          },
        },
      },
      where: { id: newChat.id },
    });
  }
}
