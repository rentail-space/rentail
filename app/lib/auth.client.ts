import {
  anonymousClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type authServer from "./auth.server";

export default createAuthClient({
  plugins: [anonymousClient(), inferAdditionalFields<typeof authServer>()],
});
