import { createAnthropic } from "@ai-sdk/anthropic";
import { captureException } from "@sentry/react-router";
import { generateObject, type UIMessage } from "ai";
import debug from "debug";
import type { User } from "prisma/generated/client";
import updateProfile from "~/data/updateProfile.md?raw";
import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { cleanParse, userProfile } from "~/lib/userProfile";

const logger = debug("profile");

/**
 * Update the user's profile based on the last message. This function
 * analyzes the last message and extracts relevant profile information like
 * location, product type, price point, and target audience.
 *
 * @param user - The user to update
 * @param lastMessage - The last message from the conversation
 * @returns The updated user profile
 */
export default async function updateUserProfile({
  user,
  lastMessage,
}: {
  user: User;
  lastMessage: UIMessage;
}): Promise<void> {
  const lastMessageText = lastMessage.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");

  try {
    const current = cleanParse(user.workingMemory);

    // Use AI to extract profile updates from conversation
    const { object: updates } = await generateObject({
      model: createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(
        "claude-haiku-4-5",
      ),
      schema: userProfile,
      prompt: updateProfile
        .replace("$[current]", JSON.stringify(current, null, 2))
        .replace("$[lastMessageText]", lastMessageText),
    });
    logger("Updating user profile: %o", updates);
    console.log("Profile updates extracted: %o", updates);

    // Merge with current profile (new values override old ones)
    const merged = {
      ...current,
      ...updates,
      location: {
        ...current.location,
        ...updates.location,
      },
      selling: {
        ...current.selling,
        ...updates.selling,
      },
      preferences: {
        ...current.preferences,
        ...updates.preferences,
      },
      sessionState: {
        ...current.sessionState,
        ...updates.sessionState,
      },
    };

    // Save updated profile
    await prisma.user.update({
      where: { id: user.id },
      data: { workingMemory: JSON.stringify(merged) },
    });

    console.log("Profile updated for user %s", user.id);
  } catch (error) {
    captureException(error, { extra: { user, lastMessageText } });
  }
}
