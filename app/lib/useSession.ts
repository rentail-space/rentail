import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import type { SessionUser } from "~/lib/sessionUser";

// Not HttpOnly: the browser reads it to know it should fetch the session.
const MARKER = "__user";

/**
 * Whether the browser holds a session marker cookie. The server renders the
 * document without user state, so this is the client's only signal that a
 * session exists - without it no request is made at all.
 */
function hasSessionMarker(): boolean {
  return (
    typeof document !== "undefined" && document.cookie.includes(`${MARKER}=`)
  );
}

/**
 * The signed-in user, fetched after hydration. Returns `null` until the
 * session arrives, which is also what the server rendered: the first client
 * render has to match it.
 *
 * Signing in and out both happen through client-side navigations (the auth
 * action redirects), so the answer is re-fetched whenever the route changes -
 * the same freshness a route loader would get, without putting user state in
 * the document.
 */
export function useSession(): { user: SessionUser | null } {
  const location = useLocation();
  const queryClient = useQueryClient();
  const previousLocation = useRef(location.key);

  const { data } = useQuery({
    enabled: hasSessionMarker(),
    queryFn: async (): Promise<{ user: SessionUser | null }> => {
      const response = await fetch("/api/session");
      if (!response.ok) return { user: null };
      return (await response.json()) as { user: SessionUser | null };
    },
    queryKey: ["session"],
    staleTime: Infinity,
  });

  useEffect(() => {
    if (previousLocation.current === location.key) return;
    previousLocation.current = location.key;

    if (!hasSessionMarker()) {
      queryClient.setQueryData(["session"], { user: null });
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["session"] });
  }, [location.key, queryClient]);

  return { user: data?.user ?? null };
}
