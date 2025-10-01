import {
  anonymousClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type authServer from "./auth.server";

export const authClient = createAuthClient({
  plugins: [anonymousClient(), inferAdditionalFields<typeof authServer>()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
