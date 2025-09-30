import {
  anonymousClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth.server";

export const authClient =
  typeof window !== "undefined"
    ? createAuthClient({
        plugins: [anonymousClient(), inferAdditionalFields<typeof auth>()],
      })
    : ({} as ReturnType<typeof createAuthClient>);

export const { signIn, signUp, signOut, useSession } = authClient;
